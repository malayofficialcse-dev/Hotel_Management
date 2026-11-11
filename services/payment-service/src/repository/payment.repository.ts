import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import {
  PaymentEntity,
  RefundEntity,
  CreatePaymentData,
  UpdatePaymentStatusData,
  CreateRefundData,
  PaymentStatus,
} from '../models/payment.entity';

@Injectable()
export class PaymentRepository extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PaymentRepository.name);

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Database connected');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }

  async findById(id: string): Promise<PaymentEntity | null> {
    return this.payment.findUnique({
      where: { id },
      include: { refunds: true },
    }) as Promise<PaymentEntity | null>;
  }

  async findByBookingId(bookingId: string): Promise<PaymentEntity | null> {
    return this.payment.findUnique({
      where: { bookingId },
      include: { refunds: true },
    }) as Promise<PaymentEntity | null>;
  }

  async findByStripeIntentId(stripeIntentId: string): Promise<PaymentEntity | null> {
    return this.payment.findUnique({
      where: { stripeIntentId },
      include: { refunds: true },
    }) as Promise<PaymentEntity | null>;
  }

  async findByUserId(userId: string): Promise<PaymentEntity[]> {
    return this.payment.findMany({
      where: { userId },
      include: { refunds: true },
      orderBy: { createdAt: 'desc' },
    }) as Promise<PaymentEntity[]>;
  }

  async createPayment(data: CreatePaymentData): Promise<PaymentEntity> {
    return this.payment.create({
      data: {
        bookingId: data.bookingId,
        bookingCode: data.bookingCode,
        userId: data.userId,
        amount: data.amount,
        currency: data.currency,
        stripeIntentId: data.stripeIntentId,
        status: PaymentStatus.PENDING,
        provider: 'STRIPE',
        metadata: data.metadata as any,
      },
      include: { refunds: true },
    }) as Promise<PaymentEntity>;
  }

  async updateStatus(id: string, data: UpdatePaymentStatusData): Promise<PaymentEntity> {
    return this.payment.update({
      where: { id },
      data: {
        status: data.status,
        ...(data.paymentMethod && { paymentMethod: data.paymentMethod }),
        ...(data.receiptUrl && { receiptUrl: data.receiptUrl }),
      },
      include: { refunds: true },
    }) as Promise<PaymentEntity>;
  }

  async updateStatusByStripeIntentId(
    stripeIntentId: string,
    data: UpdatePaymentStatusData,
  ): Promise<PaymentEntity> {
    return this.payment.update({
      where: { stripeIntentId },
      data: {
        status: data.status,
        ...(data.paymentMethod && { paymentMethod: data.paymentMethod }),
        ...(data.receiptUrl && { receiptUrl: data.receiptUrl }),
      },
      include: { refunds: true },
    }) as Promise<PaymentEntity>;
  }

  async createRefund(data: CreateRefundData): Promise<RefundEntity> {
    return this.refund.create({
      data: {
        paymentId: data.paymentId,
        amount: data.amount,
        reason: data.reason,
        stripeRefundId: data.stripeRefundId,
        status: 'SUCCESS',
      },
    }) as Promise<RefundEntity>;
  }

  async getRefundsByPaymentId(paymentId: string): Promise<RefundEntity[]> {
    return this.refund.findMany({
      where: { paymentId },
      orderBy: { createdAt: 'desc' },
    }) as Promise<RefundEntity[]>;
  }
}
