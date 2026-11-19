/** Shared WebSocket event types for real-time housekeeping updates */

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

export type HousekeepingSocketEvent =
  | "room:status_changed"
  | "room:status_changed_global"
  | "room:checkout_alert";
