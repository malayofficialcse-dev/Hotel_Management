import path from "node:path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { RoomService } from "../services/room.service.js";

const service = new RoomService();
const protoPath =
  process.env.OPERATIONS_PROTO_PATH || path.resolve(process.cwd(), "../../proto/operations.proto");

export function startGrpcServer(port: number) {
  const definition = protoLoader.loadSync(protoPath, { keepCase: true });
  const proto = grpc.loadPackageDefinition(definition) as any;
  const server = new grpc.Server();

  server.addService(proto.stayease.internal.RoomInventory.service, {
    CheckAvailability: (call: any, callback: grpc.sendUnaryData<{ is_available: boolean; available_inventory: number; json: string }>) => {
      service
        .availability(
          call.request.room_type_id,
          call.request.check_in || "",
          call.request.check_out || "",
          call.request.count || 1,
        )
        .then((result) => {
          if (!result) return callback({ code: grpc.status.NOT_FOUND, message: "Room not found" });
          callback(null, {
            is_available: result.isAvailable,
            available_inventory: result.availableInventory,
            json: JSON.stringify(result),
          });
        })
        .catch((error) => callback({ code: grpc.status.INTERNAL, message: String(error) }));
    },
  });

  return new Promise<grpc.Server>((resolve, reject) => {
    server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (error) => {
      if (error) return reject(error);
      server.start();
      console.log(`[Room Service] gRPC listening on ${port}`);
      resolve(server);
    });
  });
}
