import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import axios from 'axios';
import { ReviewRepository, HotelStats } from '../repository/review.repository';
import { CreateReviewDto, UpdateReviewDto } from '../models/review.dto';
import { ReviewDocument } from '../schemas/review.schema';
import { env } from '../config/env';

@Injectable()
export class ReviewService {
  constructor(
    @Inject(ReviewRepository)
    private readonly reviewRepository: ReviewRepository,
  ) {}

  // ─── Seed ────────────────────────────────────────────────────────────────

  async createReview(dto: CreateReviewDto): Promise<ReviewDocument> {
    let verifiedBooking = false;

    if (dto.bookingCode) {
      // Guard against duplicate reviews for the same booking
      const alreadyReviewed = await this.reviewRepository.existsByBookingCode(dto.bookingCode);
      if (alreadyReviewed) {
        throw new BadRequestException(
          `A review for booking code "${dto.bookingCode}" already exists.`,
        );
      }

      // Optionally verify booking against Booking Service
      try {
        const response = await axios.get(
          `${env.BOOKING_SERVICE_URL}/bookings/code/${dto.bookingCode}`,
          { timeout: 5000 },
        );
        if (response.status === 200 && response.data) {
          verifiedBooking = true;
          this.logger.log(`Booking code ${dto.bookingCode} verified successfully.`);
        }
      } catch (err: any) {
        // Non-blocking — if Booking Service is unreachable, review is still created
        this.logger.warn(
          `Could not verify booking code ${dto.bookingCode}: ${err?.message}. Creating unverified review.`,
        );
      }
    }

    return this.reviewRepository.create({ ...dto, verifiedBooking });
  }

  async getHotelReviews(hotelId: string): Promise<ReviewDocument[]> {
    return this.reviewRepository.findByHotel(hotelId, 50);
  }

  async getAdminReviews(): Promise<ReviewDocument[]> {
    return this.reviewRepository.findAll();
  }

  async getHotelStats(hotelId: string): Promise<HotelStats> {
    return this.reviewRepository.getStats(hotelId);
  }

  async getReviewById(id: string): Promise<ReviewDocument> {
    const review = await this.reviewRepository.findById(id);
    if (!review) {
      throw new NotFoundException(`Review with id "${id}" not found.`);
    }
    return review;
  }

  async markHelpful(id: string): Promise<ReviewDocument> {
    const review = await this.reviewRepository.markHelpful(id);
    if (!review) {
      throw new NotFoundException(`Review with id "${id}" not found.`);
    }
    return review;
  }

  async moderateReview(
    id: string,
    adminId: string,
    updateDto: UpdateReviewDto,
  ): Promise<ReviewDocument> {
    const existing = await this.reviewRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Review with id "${id}" not found.`);
    }
    const updated = await this.reviewRepository.update(id, updateDto);
    this.logger.log(`Review ${id} moderated by admin ${adminId}.`);
    return updated!;
  }

  async softDelete(id: string, role: string): Promise<{ message: string }> {
    if (role !== 'admin') {
      throw new ForbiddenException('Only administrators can delete reviews.');
    }
    const review = await this.reviewRepository.findById(id);
    if (!review) {
      throw new NotFoundException(`Review with id "${id}" not found.`);
    }
    await this.reviewRepository.softDelete(id);
    return { message: `Review ${id} has been hidden successfully.` };
  }
}
