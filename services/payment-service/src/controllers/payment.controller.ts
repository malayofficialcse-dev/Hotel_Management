import { Controller, Post, Body, Get, Param, Req, ForbiddenException, Inject } from "@nestjs/common";
import type { Request } from "express";
import { PaymentService } from "../services/payment.service.js";
import { CreatePaymentIntentDto, ConfirmPaymentDto, RefundDto } from "../models/payment.dto.js";

@Controller("api/v1/payments")
export class PaymentController {
  constructor(@Inject(PaymentService) private readonly paymentService: PaymentService) { }

  @Get("health")
  healthCheck() {
    return { status: "UP", service: "payment-service", engine: "NestJS + PostgreSQL (Prisma)", port: 8006 };
  }

  @Post("intent")
  createIntent(@Body() dto: CreatePaymentIntentDto) {
    return this.paymentService.createIntent(dto);
  }

  @Post("confirm")
  confirmPayment(@Body() dto: ConfirmPaymentDto) {
    return this.paymentService.confirmPayment(dto);
  }

  @Post("refund")
  processRefund(@Body() dto: RefundDto) {
    return this.paymentService.processRefund(dto);
  }

  @Get("booking/:bookingId")
  getByBooking(@Param("bookingId") bookingId: string) {
    return this.paymentService.getByBookingId(bookingId);
  }

  @Get("lookup")
  lookupByCode(@Req() request: Request) {
    const code = (request.query.code as string) || "";
    return this.paymentService.getByBookingCode(code);
  }

  @Get("code/:code")
  getByBookingCode(@Param("code") code: string) {
    return this.paymentService.getByBookingCode(code);
  }

  @Get("admin")
  getAdminPayments(@Req() request: Request & { user?: { role?: string } }) {
    if (request.user?.role !== "ADMIN") throw new ForbiddenException("Administrator access required");
    return this.paymentService.getAdminPayments();
  }
}

