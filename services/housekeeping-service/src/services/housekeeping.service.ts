import { Injectable, OnModuleInit } from "@nestjs/common";
import { HousekeepingRepository } from "../repository/housekeeping.repository.js";
import { CleaningStatus } from "../models/housekeeping.schema.js";
import { RabbitMQService } from "./rabbitmq.service.js";

const DEFAULT_TASKS = [
  { hotelId: "palm-house", roomNumber: "101", status: CleaningStatus.CLEAN, checklist: ["Linens Changed", "Bathroom Sanitized", "Mini-bar Restocked"] },
  { hotelId: "palm-house", roomNumber: "102", status: CleaningStatus.DIRTY, checklist: ["Towels Replaced", "Floors Vacuumed"] },
  { hotelId: "palm-house", roomNumber: "103", status: CleaningStatus.IN_PROGRESS, checklist: ["Air Vents Cleaned"] },
  { hotelId: "palm-house", roomNumber: "104", status: CleaningStatus.INSPECTED, checklist: ["Final Inspection Passed"] },
];

@Injectable()
export class HousekeepingService implements OnModuleInit {
  constructor(
    private readonly repo: HousekeepingRepository,
    private readonly rabbitmq: RabbitMQService,
  ) {}

  async onModuleInit() {
    try {
      const existing = await this.repo.findByHotel("palm-house");
      if (existing.length === 0) {
        for (const task of DEFAULT_TASKS) {
          await this.repo.create(task as any);
        }
        console.log("🌱 [Housekeeping Service] Initial cleaning tasks seeded into MongoDB.");
      }
    } catch {}
  }

  async getTasks(hotelId: string) {
    const tasks = await this.repo.findByHotel(hotelId);
    if (tasks.length > 0) return tasks;
    return DEFAULT_TASKS;
  }

  async updateTaskStatus(id: string, status: CleaningStatus, notes?: string) {
    const updated = await this.repo.updateStatus(id, status, notes);
    if (status === CleaningStatus.CLEAN || status === CleaningStatus.INSPECTED) {
      await this.rabbitmq.publish("room.cleaned", {
        event_type: "room.cleaned",
        taskId: id,
        hotelId: (updated as any)?.hotelId,
        roomNumber: (updated as any)?.roomNumber,
        status,
        notes,
      });
    }
    return updated;
  }

  async createTask(data: any) {
    return this.repo.create(data);
  }
}

