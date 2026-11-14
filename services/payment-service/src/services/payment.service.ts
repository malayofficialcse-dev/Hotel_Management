import { Injectable, BadRequestException, Inject } from "@nestjs/common";
import { PaymentRepository } from "../repository/payment.repository.js";
import { CreatePaymentIntentDto, ConfirmPaymentDto, RefundDto } from "../models/payment.dto.js";
import { PaymentStatus } from "../models/payment.entity.js";
import { RabbitMQService } from "./rabbitmq.service.js";
import { env } from "../config/env.js";
import axios from "axios";

@Injectable()
export class PaymentService {
  constructor(
    @Inject(PaymentRepository) private readonly repo: PaymentRepository,
    @Inject(RabbitMQService) private readonly rabbitmq: RabbitMQService,
  ) { }

  async createIntent(dto: CreatePaymentIntentDto) {
    const mockIntentId = `pi_mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const payment = await this.repo.createPayment({
      bookingId: dto.bookingId,
      bookingCode: dto.bookingCode,
      amount: dto.amount,
      currency: dto.currency || "INR",
      userId: dto.userId,
      stripeIntentId: mockIntentId,
    });

    const clientSecret = `pi_mock_${payment.id}_secret_${Date.now()}`;
    return {
      success: true,
      clientSecret,
      paymentId: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      bookingCode: payment.bookingCode,
    };
  }

  async confirmPayment(dto: ConfirmPaymentDto) {
    let payment = null;
    if (dto.paymentId) {
      payment = await this.repo.findById(dto.paymentId);
    }
    if (!payment && dto.stripeIntentId) {
      payment = await this.repo.findByStripeIntentId(dto.stripeIntentId);
    }
    if (!payment) {
      throw new BadRequestException("Payment record not found");
    }

    const year = new Date().getFullYear();
    let hotelShort = dto.hotelShortCode || "";
    if (!hotelShort && payment.bookingCode) {
      const parts = payment.bookingCode.split("/");
      if (parts.length > 1) {
        hotelShort = parts[0];
      }
    }
    if (!hotelShort && dto.hotelName) {
      const words = dto.hotelName.trim().split(/[\s-_]+/);
      hotelShort = words.length > 1 ? words.map(w => w[0]).join("").toUpperCase().slice(0, 4) : dto.hotelName.slice(0, 3).toUpperCase();
    }
    if (!hotelShort) {
      hotelShort = "HTL";
    }

    const count = await this.repo.countConfirmedInYear(year);
    const seq = String(count + 1).padStart(4, "0");
    const billNumber = `${hotelShort}/BILL/${year}/${seq}`;
    const txnId = `TXN-${year}-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const metadata: Record<string, unknown> = {
      billNumber,
      invoiceNumber: billNumber,
      invoiceDate: new Date().toISOString(),
      transactionId: txnId,
      paymentMethod: dto.paymentMethod || "Credit / Debit card",
      hotelShortCode: hotelShort,
      hotelName: dto.hotelName || "StayEase Luxury Hotel",
      roomTypeName: dto.roomTypeName || "Standard Room",
      guestName: dto.guestName || "Guest",
      guestEmail: dto.guestEmail || "",
      guestPhone: dto.guestPhone || "",
      checkInDate: dto.checkInDate || "",
      checkOutDate: dto.checkOutDate || "",
      totalNights: dto.totalNights || 1,
      roomCount: dto.roomCount || 1,
      subtotal: dto.subtotal || payment.amount,
      taxesAndFees: dto.taxesAndFees || 0,
      totalAmount: dto.totalAmount || payment.amount,
      status: "PAID",
    };

    const receiptUrl = `/booking/bill?code=${encodeURIComponent(payment.bookingCode)}&invoice=${encodeURIComponent(billNumber)}`;

    const updatedPayment = await this.repo.updateStatus(payment.id, {
      status: PaymentStatus.SUCCESS,
      paymentMethod: dto.paymentMethod || "Credit / Debit card",
      receiptUrl,
      metadata,
    });

    // Call Go Booking Service to mark booking as CONFIRMED
    try {
      await axios.post(`${env.BOOKING_SERVICE_URL}/api/v1/bookings/${payment.bookingId}/confirm`);
    } catch (e: any) {
      console.warn("⚠️ [Payment Service] Failed to notify Booking Service:", e.message);
    }

    // Publish payment.succeeded event to RabbitMQ
    try {
      await this.rabbitmq.publish("payment.succeeded", {
        event_type: "payment.succeeded",
        paymentId: payment.id,
        bookingId: payment.bookingId,
        bookingCode: payment.bookingCode,
        billNumber,
        amount: payment.amount,
        currency: payment.currency,
        userId: payment.userId,
      });
    } catch (e: any) {
      console.warn("⚠️ [Payment Service] RabbitMQ publish skipped:", e.message);
    }

    return {
      success: true,
      message: "Payment confirmed successfully",
      payment: updatedPayment,
      billNumber,
      receiptUrl,
    };
  }

  async processRefund(dto: RefundDto) {
    const refund = await this.repo.createRefund({
      paymentId: dto.paymentId,
      amount: dto.amount || 0,
      reason: dto.reason || "Customer refund request",
    });
    await this.repo.updateStatus(dto.paymentId, { status: PaymentStatus.REFUNDED });

    return { success: true, message: "Refund processed successfully", refund };
  }

  async getByBookingId(bookingId: string) {
    return this.repo.findByBookingId(bookingId);
  }

  async getByBookingCode(bookingCode: string) {
    return this.repo.findByBookingCode(bookingCode);
  }

  async getAdminPayments() {
    return this.repo.findAll();
  }
}

