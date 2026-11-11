import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  OnApplicationBootstrap,
  Logger,
} from '@nestjs/common';
import axios from 'axios';
import { ReviewRepository, HotelStats } from '../repository/review.repository';
import { CreateReviewDto, UpdateReviewDto } from '../models/review.dto';
import { ReviewDocument } from '../schemas/review.schema';
import { env } from '../config/env';

@Injectable()
export class ReviewService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ReviewService.name);

  constructor(
    @Inject(ReviewRepository)
    private readonly reviewRepository: ReviewRepository,
  ) {}

  // ─── Seed ────────────────────────────────────────────────────────────────

  async onApplicationBootstrap(): Promise<void> {
    await this.seedInitialReviews();
  }

  private async seedInitialReviews(): Promise<void> {
    const count = await this.reviewRepository.countByHotel('palm-house');
    if (count > 0) {
      this.logger.log('Seed data already present — skipping.');
      return;
    }

    const seeds: Array<Partial<CreateReviewDto> & Record<string, any>> = [
      {
        hotelId: 'palm-house',
        userId: 'seed-user-001',
        userName: 'Anjali Sharma',
        userAvatar: 'https://i.pravatar.cc/150?img=5',
        rating: 5,
        title: 'Absolutely stunning stay!',
        comment:
          'The Palm House exceeded every expectation. The staff were incredibly attentive, the room was immaculate, and the sea-view breakfast was unforgettable. Will definitely return.',
        ratingsBreakdown: {
          cleanliness: 5,
          comfort: 5,
          location: 5,
          service: 5,
          valueForMoney: 4,
        },
        stayDate: '2024-10-10T00:00:00.000Z',
        verifiedBooking: true,
        bookingCode: 'SEED-BK-001',
        helpfulCount: 12,
        isApproved: true,
        isHidden: false,
      },
      {
        hotelId: 'palm-house',
        userId: 'seed-user-002',
        userName: 'Marco Bianchi',
        userAvatar: 'https://i.pravatar.cc/150?img=12',
        rating: 4,
        title: 'Great location, minor noise issue',
        comment:
          'Wonderful property in the heart of the city. The pool area is gorgeous and the bed was extremely comfortable. Only downside was some street noise at night, but overall a fantastic experience.',
        ratingsBreakdown: {
          cleanliness: 4,
          comfort: 4,
          location: 5,
          service: 4,
          valueForMoney: 4,
        },
        stayDate: '2024-09-22T00:00:00.000Z',
        verifiedBooking: true,
        bookingCode: 'SEED-BK-002',
        helpfulCount: 7,
        isApproved: true,
        isHidden: false,
      },
      {
        hotelId: 'palm-house',
        userName: 'Sarah O\'Brien',
        userAvatar: 'https://i.pravatar.cc/150?img=47',
        rating: 3,
        title: 'Good but overpriced',
        comment:
          'The hotel is beautiful and the staff are friendly, but for the price I expected a bit more in terms of room size and breakfast variety. It is a solid choice for a weekend, just not a bargain.',
        ratingsBreakdown: {
          cleanliness: 4,
          comfort: 3,
          location: 4,
          service: 4,
          valueForMoney: 2,
        },
        stayDate: '2024-08-14T00:00:00.000Z',
        verifiedBooking: false,
        helpfulCount: 3,
        isApproved: true,
        isHidden: false,
      },
    ];

    for (const seed of seeds) {
      await this.reviewRepository.create(seed);
    }
    this.logger.log('Seeded 3 reviews for palm-house hotel.');
  }

  // ─── Core Operations ─────────────────────────────────────────────────────

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
