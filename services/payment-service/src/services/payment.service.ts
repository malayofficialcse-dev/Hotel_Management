import { Injectable, BadRequestException } from "@nestjs/common";
import { PaymentRepository } from "../repository/payment.repository.js";
import { CreatePaymentIntentDto, ConfirmPaymentDto, RefundDto } from "../models/payment.dto.js";
import { RabbitMQService } from "./rabbitmq.service.js";
import { env } from "../config/env.js";
import axios from "axios";

@Injectable()
export class PaymentService {
  constructor(
    private readonly repo: PaymentRepository,
    private readonly rabbitmq: RabbitMQService,
  ) {}

  async createIntent(dto: CreatePaymentIntentDto) {
    const payment = await this.repo.createPayment({
      bookingId: dto.bookingId,
      bookingCode: dto.bookingCode,
      amount: dto.amount,
      currency: dto.currency || "INR",
      userId: dto.userId,
      status: "PENDING",
      provider: "STRIPE",
    });

    const clientSecret = `pi_mock_${payment.id}_secret_${Date.now()}`;
    return {
      success: true,
      clientSecret,
      paymentId: payment.id,
      amount: payment.amount,
      currency: payment.currency,
    };
  }

  async confirmPayment(dto: ConfirmPaymentDto) {
    const payment = await this.repo.updateStatus(dto.paymentId, "SUCCESS");

    // Call Go Booking Service to mark booking as CONFIRMED
    try {
      await axios.post(`${env.BOOKING_SERVICE_URL}/api/v1/bookings/${payment.bookingId}/confirm`);
    } catch (e: any) {
      console.warn("⚠️ [Payment Service] Failed to notify Booking Service:", e.message);
    }

    // Publish payment.succeeded event to RabbitMQ
    await this.rabbitmq.publish("payment.succeeded", {
      event_type: "payment.succeeded",
      paymentId: payment.id,
      bookingId: payment.bookingId,
      bookingCode: payment.bookingCode,
      amount: payment.amount,
      currency: payment.currency,
      userId: payment.userId,
    });

    return { success: true, message: "Payment confirmed successfully", payment };
  }

  async processRefund(dto: RefundDto) {
    const refund = await this.repo.createRefund(dto.paymentId, dto.amount, dto.reason);
    await this.repo.updateStatus(dto.paymentId, "REFUNDED");

    return { success: true, message: "Refund processed successfully", refund };
  }

  async getByBookingId(bookingId: string) {
    return this.repo.findByBookingId(bookingId);
  }

  async getAdminPayments() {
    return this.repo.findAll();
  }
}

