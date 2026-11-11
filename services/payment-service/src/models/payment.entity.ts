export interface PaymentEntity {
  id: string;
  bookingId: string;
  bookingCode: string;
  userId?: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: string;
  stripeIntentId?: string | null;
  paymentMethod?: string | null;
  receiptUrl?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  refunds?: RefundEntity[];
}

export interface RefundEntity {
  id: string;
  paymentId: string;
  amount: number;
  reason?: string | null;
  stripeRefundId?: string | null;
  status: RefundStatus;
  createdAt: Date;
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum RefundStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export interface CreatePaymentData {
  bookingId: string;
  bookingCode: string;
  userId?: string;
  amount: number;
  currency: string;
  stripeIntentId: string;
  metadata?: Record<string, unknown>;
}

export interface UpdatePaymentStatusData {
  status: PaymentStatus;
  paymentMethod?: string;
  receiptUrl?: string;
}

export interface CreateRefundData {
  paymentId: string;
  amount: number;
  reason?: string;
  stripeRefundId: string;
}

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentId: string;
  stripeIntentId: string;
}

export interface ReceiptData {
  paymentId: string;
  bookingCode: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod?: string | null;
  receiptUrl?: string | null;
  createdAt: Date;
  refunds: RefundEntity[];
}
