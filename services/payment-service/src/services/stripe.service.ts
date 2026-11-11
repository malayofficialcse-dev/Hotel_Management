import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { env } from '../config/env';

@Injectable()
export class StripeService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);

  constructor() {
    this.stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
      typescript: true,
    });
  }

  async createPaymentIntent(params: {
    amount: number;
    currency: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(params.amount * 100), // convert to smallest unit (paise for INR)
        currency: params.currency.toLowerCase(),
        metadata: params.metadata || {},
        automatic_payment_methods: { enabled: true },
      });
      this.logger.log(`PaymentIntent created: ${paymentIntent.id}`);
      return paymentIntent;
    } catch (error) {
      this.logger.error('Failed to create PaymentIntent', error);
      throw error;
    }
  }

  constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
    try {
      return this.stripe.webhooks.constructEvent(
        payload,
        signature,
        env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (error) {
      this.logger.error('Invalid Stripe webhook signature', error);
      throw error;
    }
  }

  async createRefund(params: {
    paymentIntentId: string;
    amount?: number;
    reason?: Stripe.RefundCreateParams.Reason;
  }): Promise<Stripe.Refund> {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: params.paymentIntentId,
        ...(params.amount && { amount: Math.round(params.amount * 100) }),
        ...(params.reason && { reason: params.reason }),
      });
      this.logger.log(`Refund created: ${refund.id} for PaymentIntent: ${params.paymentIntentId}`);
      return refund;
    } catch (error) {
      this.logger.error('Failed to create Stripe refund', error);
      throw error;
    }
  }

  async retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    return this.stripe.paymentIntents.retrieve(paymentIntentId);
  }
}
