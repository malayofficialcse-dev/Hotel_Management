import type { Server as HttpServer } from "node:http";
import { Server as SocketIOServer, type Socket } from "socket.io";
import * as amqp from "amqplib";
import { HousekeepingTaskModel } from "../models/housekeeping-task.model.js";
import mongoose from "mongoose";

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost:5672";
const EXCHANGE = "hotel_events";

export interface RoomStatusEvent {
  event: string;
  taskId?: string;
  hotelId: string;
  roomNumber: string;
  status: string;
  priority?: string;
  guestName?: string;
  bookingReference?: string;
  assignedTo?: string;
  taskType?: string;
  updatedBy?: string;
  timestamp: string;
}

let io: SocketIOServer | null = null;
let amqpChannel: amqp.Channel | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;

/** Attach Socket.IO to an existing http.Server and start the RabbitMQ consumer */
export async function attachWebSocketGateway(httpServer: HttpServer): Promise<SocketIOServer> {
  const clientOrigins = new Set(["http://localhost:3000", "http://127.0.0.1:3000"]);
  try {
    const configuredOrigin = new URL(process.env.CLIENT_URL || "http://localhost:3000").origin;
    if (["http:", "https:"].includes(new URL(configuredOrigin).protocol)) {
      clientOrigins.add(configuredOrigin);
    }
  } catch {
    console.warn("[WS Gateway] Ignoring invalid CLIENT_URL; using local frontend origins.");
  }

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: [...clientOrigins, "http://localhost:3001"],
      methods: ["GET", "POST"],
      credentials: true,
    },
    path: "/ws/housekeeping",
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket: Socket) => {
    console.log(`[WS Gateway] Client connected: ${socket.id}`);

    // Client joins a hotel-scoped room to receive targeted updates
    socket.on("join:hotel", (hotelId: string) => {
      if (typeof hotelId === "string" && hotelId.trim()) {
        socket.join(`hotel:${hotelId.trim()}`);
        console.log(`[WS Gateway] ${socket.id} joined hotel:${hotelId.trim()}`);
      }
    });

    socket.on("leave:hotel", (hotelId: string) => {
      socket.leave(`hotel:${hotelId.trim()}`);
    });

    // Staff-initiated status transition from frontend (mobile tap)
    socket.on("room:status_update", async (payload: {
      taskId: string;
      hotelId: string;
      roomNumber: string;
      newStatus: string;
      updatedBy?: string;
    }) => {
      try {
        if (!mongoose.isValidObjectId(payload.taskId)) return;

        const allowedStatuses = ["DIRTY", "IN_PROGRESS", "CLEAN", "INSPECTED", "MAINTENANCE"];
        if (!allowedStatuses.includes(payload.newStatus)) return;

        const updateData: Record<string, unknown> = { status: payload.newStatus };
        if (payload.newStatus === "CLEAN" || payload.newStatus === "INSPECTED") {
          updateData.completedAt = new Date();
        }
        if (payload.updatedBy) updateData.inspectedBy = payload.updatedBy;

        const updated = await HousekeepingTaskModel.findByIdAndUpdate(
          payload.taskId,
          updateData,
          { new: true, runValidators: true }
        ).lean();

        if (!updated) return;

        const event: RoomStatusEvent = {
          event: "room.status_changed",
          taskId: String(updated._id),
          hotelId: updated.hotelId,
          roomNumber: updated.roomNumber,
          status: updated.status,
          priority: updated.priority,
          guestName: updated.guestName,
          bookingReference: updated.bookingReference,
          assignedTo: updated.assignedTo,
          taskType: updated.taskType,
          updatedBy: payload.updatedBy,
          timestamp: new Date().toISOString(),
        };

        // Broadcast to all clients in that hotel's room
        io?.to(`hotel:${updated.hotelId}`).emit("room:status_changed", event);
        // Also broadcast globally for supervisors watching all hotels
        io?.emit("room:status_changed_global", event);

        // Publish to RabbitMQ for downstream services
        publishToRabbitMQ("room.status_changed", event);
      } catch (err) {
        console.error("[WS Gateway] room:status_update error:", err);
      }
    });

    socket.on("disconnect", (reason) => {
      console.log(`[WS Gateway] Client disconnected ${socket.id}: ${reason}`);
    });
  });

  // Start consuming RabbitMQ events
  await connectRabbitMQConsumer();

  console.log("[WS Gateway] Socket.IO gateway attached on /ws/housekeeping");
  return io;
}

/** Publish an event back onto RabbitMQ hotel_events exchange */
function publishToRabbitMQ(routingKey: string, payload: unknown): void {
  if (!amqpChannel) return;
  try {
    amqpChannel.publish(
      EXCHANGE,
      routingKey,
      Buffer.from(JSON.stringify(payload)),
      { persistent: true, contentType: "application/json" }
    );
  } catch (err) {
    console.warn("[WS Gateway] RabbitMQ publish failed:", err);
  }
}

/** Connect to RabbitMQ and consume booking + room events */
async function connectRabbitMQConsumer(): Promise<void> {
  try {
    const conn = await amqp.connect(RABBITMQ_URL);

    conn.on("error", (err) => {
      console.warn("[WS Gateway] RabbitMQ connection error:", err.message);
      scheduleRabbitMQReconnect();
    });
    conn.on("close", () => {
      console.warn("[WS Gateway] RabbitMQ connection closed, reconnecting...");
      scheduleRabbitMQReconnect();
    });

    amqpChannel = await conn.createChannel();
    await amqpChannel.assertExchange(EXCHANGE, "topic", { durable: true });

    // Declare a durable queue for the housekeeping-ws consumer
    const { queue } = await amqpChannel.assertQueue("housekeeping.ws.consumer", {
      durable: true,
      arguments: { "x-message-ttl": 60000 },
    });

    // Bind to relevant routing keys
    const bindingKeys = [
      "booking.checked_out",
      "booking.check_in",
      "booking.cancelled",
      "room.status_changed",
      "housekeeping.task_created",
      "housekeeping.task_updated",
    ];

    for (const key of bindingKeys) {
      await amqpChannel.bindQueue(queue, EXCHANGE, key);
    }

    amqpChannel.consume(queue, async (msg) => {
      if (!msg) return;
      try {
        const routingKey = msg.fields.routingKey;
        const body = JSON.parse(msg.content.toString()) as Record<string, unknown>;

        await handleRabbitMQEvent(routingKey, body);
        amqpChannel?.ack(msg);
      } catch (err) {
        console.error("[WS Gateway] Message processing error:", err);
        amqpChannel?.nack(msg, false, false); // Dead-letter the bad message
      }
    });

    console.log("[WS Gateway] RabbitMQ consumer listening on hotel_events exchange");
  } catch (err) {
    console.warn("[WS Gateway] RabbitMQ not available, running in polling-only mode:", (err as Error).message);
    // Don't throw — service runs fine without RabbitMQ, just no event-driven updates
  }
}

function scheduleRabbitMQReconnect(): void {
  if (reconnectTimer) return;
  amqpChannel = null;
  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    await connectRabbitMQConsumer();
  }, 5000);
}

/** Handle incoming RabbitMQ events and push to WebSocket clients */
async function handleRabbitMQEvent(routingKey: string, body: Record<string, unknown>): Promise<void> {
  console.log(`[WS Gateway] Event received: ${routingKey}`, body);

  switch (routingKey) {
    case "booking.checked_out": {
      // When a guest checks out: create or update housekeeping task to DIRTY
      const hotelId = String(body.hotel_id || body.hotelId || "");
      const roomNumber = String(body.room_number || body.roomNumber || "");
      const bookingRef = String(body.booking_code || body.bookingCode || "");

      if (!hotelId || !roomNumber) break;

      // Auto-create a checkout clean task
      const today = new Date().toISOString().split("T")[0];
      let task = await HousekeepingTaskModel.findOne({ hotelId, roomNumber, taskDate: today }).lean();

      if (!task) {
        task = await HousekeepingTaskModel.create({
          hotelId,
          roomNumber,
          status: "DIRTY",
          taskType: "CHECKOUT CLEAN",
          taskDate: today,
          scheduledDate: new Date(),
          bookingReference: bookingRef,
          guestName: String(body.guest_name || body.guestName || ""),
          priority: "HIGH",
        });
      } else {
        await HousekeepingTaskModel.findByIdAndUpdate(task._id, {
          status: "DIRTY",
          taskType: "CHECKOUT CLEAN",
          priority: "HIGH",
        });
      }

      const event: RoomStatusEvent = {
        event: "room.checked_out",
        taskId: String(task._id),
        hotelId,
        roomNumber,
        status: "DIRTY",
        priority: "HIGH",
        guestName: String(body.guest_name || body.guestName || ""),
        bookingReference: bookingRef,
        taskType: "CHECKOUT CLEAN",
        timestamp: new Date().toISOString(),
      };

      io?.to(`hotel:${hotelId}`).emit("room:status_changed", event);
      io?.emit("room:status_changed_global", event);
      io?.emit("room:checkout_alert", event);
      break;
    }

    case "booking.check_in": {
      // When a guest checks in: mark the room as OCCUPIED (clear dirty flags)
      const hotelId = String(body.hotel_id || body.hotelId || "");
      const roomNumber = String(body.room_number || body.roomNumber || "");
      if (!hotelId || !roomNumber) break;

      const event: RoomStatusEvent = {
        event: "room.checked_in",
        hotelId,
        roomNumber,
        status: "OCCUPIED",
        guestName: String(body.guest_name || body.guestName || ""),
        bookingReference: String(body.booking_code || body.bookingCode || ""),
        timestamp: new Date().toISOString(),
      };

      io?.to(`hotel:${hotelId}`).emit("room:status_changed", event);
      io?.emit("room:status_changed_global", event);
      break;
    }

    case "booking.cancelled": {
      const hotelId = String(body.hotel_id || body.hotelId || "");
      const roomNumber = String(body.room_number || body.roomNumber || "");
      if (!hotelId || !roomNumber) break;

      const event: RoomStatusEvent = {
        event: "room.booking_cancelled",
        hotelId,
        roomNumber,
        status: "DIRTY",
        timestamp: new Date().toISOString(),
      };

      io?.to(`hotel:${hotelId}`).emit("room:status_changed", event);
      io?.emit("room:status_changed_global", event);
      break;
    }

    case "housekeeping.task_created":
    case "housekeeping.task_updated": {
      const hotelId = String(body.hotelId || "");
      if (!hotelId) break;

      const event: RoomStatusEvent = {
        event: routingKey,
        taskId: String(body.taskId || body._id || ""),
        hotelId,
        roomNumber: String(body.roomNumber || ""),
        status: String(body.status || "DIRTY"),
        priority: String(body.priority || "NORMAL"),
        assignedTo: String(body.assignedTo || ""),
        timestamp: new Date().toISOString(),
      };

      io?.to(`hotel:${hotelId}`).emit("room:status_changed", event);
      io?.emit("room:status_changed_global", event);
      break;
    }

    default:
      break;
  }
}

/** Get the Socket.IO server instance for use in controllers */
export function getSocketIOServer(): SocketIOServer | null {
  return io;
}

/** Emit a room status change from HTTP controllers (after PATCH requests) */
export function emitRoomStatusChange(event: RoomStatusEvent): void {
  if (!io) return;
  io.to(`hotel:${event.hotelId}`).emit("room:status_changed", event);
  io.emit("room:status_changed_global", event);
}
