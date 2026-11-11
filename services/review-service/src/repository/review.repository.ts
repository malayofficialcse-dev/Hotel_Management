import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { Review, ReviewDocument } from '../schemas/review.schema';
import { CreateReviewDto, UpdateReviewDto } from '../models/review.dto';

export interface HotelStats {
  totalReviews: number;
  averageRating: number;
  breakdown: {
    cleanliness: number;
    comfort: number;
    location: number;
    service: number;
    valueForMoney: number;
  };
  ratingDistribution: Record<number, number>;
}

@Injectable()
export class ReviewRepository {
  constructor(
    @InjectModel(Review.name) private readonly reviewModel: Model<ReviewDocument>,
  ) {}

  async findByHotel(hotelId: string, limit = 50): Promise<ReviewDocument[]> {
    return this.reviewModel
      .find({ hotelId, isApproved: true, isHidden: false })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async findById(id: string): Promise<ReviewDocument | null> {
    return this.reviewModel.findById(id).exec();
  }

  async findAll(filter: FilterQuery<ReviewDocument> = {}): Promise<ReviewDocument[]> {
    return this.reviewModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async create(data: Partial<CreateReviewDto> & Record<string, any>): Promise<ReviewDocument> {
    const review = new this.reviewModel(data);
    return review.save();
  }

  async update(id: string, data: UpdateReviewDto): Promise<ReviewDocument | null> {
    return this.reviewModel
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .exec();
  }

  async softDelete(id: string): Promise<ReviewDocument | null> {
    return this.reviewModel
      .findByIdAndUpdate(id, { $set: { isHidden: true } }, { new: true })
      .exec();
  }

  async markHelpful(id: string): Promise<ReviewDocument | null> {
    return this.reviewModel
      .findByIdAndUpdate(id, { $inc: { helpfulCount: 1 } }, { new: true })
      .exec();
  }

  async getStats(hotelId: string): Promise<HotelStats> {
    const pipeline = [
      { $match: { hotelId, isApproved: true, isHidden: false } },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          avgCleanliness: { $avg: '$ratingsBreakdown.cleanliness' },
          avgComfort: { $avg: '$ratingsBreakdown.comfort' },
          avgLocation: { $avg: '$ratingsBreakdown.location' },
          avgService: { $avg: '$ratingsBreakdown.service' },
          avgValueForMoney: { $avg: '$ratingsBreakdown.valueForMoney' },
          ratings: { $push: '$rating' },
        },
      },
    ];

    const [result] = await this.reviewModel.aggregate(pipeline).exec();

    if (!result) {
      return {
        totalReviews: 0,
        averageRating: 0,
        breakdown: {
          cleanliness: 0,
          comfort: 0,
          location: 0,
          service: 0,
          valueForMoney: 0,
        },
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    // Build rating distribution
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    (result.ratings as number[]).forEach((r) => {
      const key = Math.round(r);
      if (key >= 1 && key <= 5) distribution[key]++;
    });

    return {
      totalReviews: result.totalReviews,
      averageRating: parseFloat((result.averageRating || 0).toFixed(2)),
      breakdown: {
        cleanliness: parseFloat((result.avgCleanliness || 0).toFixed(2)),
        comfort: parseFloat((result.avgComfort || 0).toFixed(2)),
        location: parseFloat((result.avgLocation || 0).toFixed(2)),
        service: parseFloat((result.avgService || 0).toFixed(2)),
        valueForMoney: parseFloat((result.avgValueForMoney || 0).toFixed(2)),
      },
      ratingDistribution: distribution,
    };
  }

  async countByHotel(hotelId: string): Promise<number> {
    return this.reviewModel.countDocuments({ hotelId, isApproved: true, isHidden: false });
  }

  async existsByBookingCode(bookingCode: string): Promise<boolean> {
    const doc = await this.reviewModel.findOne({ bookingCode }).lean().exec();
    return !!doc;
  }
}
