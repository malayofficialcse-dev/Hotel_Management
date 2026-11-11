import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentIntentDto {
  @ApiProperty({ example: 'uuid-booking-id' })
  @IsString()
  @IsNotEmpty()
  bookingId: string;

  @ApiProperty({ example: 'BK-20240101-001' })
  @IsString()
  @IsNotEmpty()
  bookingCode: string;

  @ApiProperty({ example: 5000, description: 'Amount in smallest currency unit (paise for INR)' })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiPropertyOptional({ example: 'INR', default: 'INR' })
  @IsOptional()
  @IsString()
  currency?: string = 'INR';

  @ApiPropertyOptional({ example: 'uuid-user-id' })
  @IsOptional()
  @IsString()
  userId?: string;
}

export class ConfirmPaymentDto {
  @ApiProperty({ example: 'pi_stripe_payment_intent_id' })
  @IsString()
  @IsNotEmpty()
  stripeIntentId: string;
}

export class RefundDto {
  @ApiProperty({ example: 'uuid-payment-id' })
  @IsString()
  @IsNotEmpty()
  paymentId: string;

  @ApiPropertyOptional({ example: 'Guest requested cancellation' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ example: 2500, description: 'Partial refund amount in paise; full refund if omitted' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  amount?: number;
}
