"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { RoomStatusEvent } from "@/types/housekeeping-ws";

const WS_URL = process.env.NEXT_PUBLIC_HOUSEKEEPING_WS_URL || "http://localhost:8020";

export interface UseHousekeepingSocketOptions {
  hotelIds: string[];
  onStatusChange?: (event: RoomStatusEvent) => void;
  onCheckoutAlert?: (event: RoomStatusEvent) => void;
  /** Watch all hotels (supervisor mode) */
  global?: boolean;
}

export interface UseHousekeepingSocketReturn {
  connected: boolean;
  lastEvent: RoomStatusEvent | null;
  emit: (eventName: string, payload: unknown) => void;
}

export function useHousekeepingSocket({
  hotelIds,
  onStatusChange,
  onCheckoutAlert,
  global: watchGlobal = false,
}: UseHousekeepingSocketOptions): UseHousekeepingSocketReturn {
  const socketRef = useRef<import("socket.io-client").Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<RoomStatusEvent | null>(null);

  const onStatusChangeRef = useRef(onStatusChange);
  const onCheckoutAlertRef = useRef(onCheckoutAlert);
  useEffect(() => { onStatusChangeRef.current = onStatusChange; }, [onStatusChange]);
  useEffect(() => { onCheckoutAlertRef.current = onCheckoutAlert; }, [onCheckoutAlert]);

  useEffect(() => {
    // Dynamic import so server-side rendering doesn't blow up
    let socket: import("socket.io-client").Socket | null = null;
    let destroyed = false;

    import("socket.io-client").then(({ io }) => {
      if (destroyed) return;

      socket = io(WS_URL, {
        path: "/ws/housekeeping",
        transports: ["websocket", "polling"],
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
      });

      socketRef.current = socket;

      socket.on("connect", () => {
        if (destroyed) return;
        setConnected(true);
        // Join each hotel room for targeted updates
        for (const hotelId of hotelIds) {
          if (hotelId) socket!.emit("join:hotel", hotelId);
        }
      });

      socket.on("disconnect", () => {
        if (!destroyed) setConnected(false);
      });

      const handleStatusChanged = (event: RoomStatusEvent) => {
        if (destroyed) return;
        setLastEvent(event);
        onStatusChangeRef.current?.(event);
      };

      const handleCheckoutAlert = (event: RoomStatusEvent) => {
        if (destroyed) return;
        setLastEvent(event);
        onCheckoutAlertRef.current?.(event);
      };

      socket.on("room:status_changed", handleStatusChanged);
      if (watchGlobal) {
        socket.on("room:status_changed_global", handleStatusChanged);
      }
      socket.on("room:checkout_alert", handleCheckoutAlert);
    }).catch((err) => {
      console.warn("[useHousekeepingSocket] socket.io-client not available:", err);
    });

    return () => {
      destroyed = true;
      if (socket) {
        for (const hotelId of hotelIds) {
          if (hotelId) socket.emit("leave:hotel", hotelId);
        }
        socket.disconnect();
      }
      socketRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelIds.join(","), watchGlobal]);

  const emit = useCallback((eventName: string, payload: unknown) => {
    socketRef.current?.emit(eventName, payload);
  }, []);

  return { connected, lastEvent, emit };
}
