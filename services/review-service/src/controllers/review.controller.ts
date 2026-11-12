import { Controller, Get, Post, Body, Param, Req, ForbiddenException } from "@nestjs/common";
import type { Request } from "express";
import { ReviewService } from "../services/review.service.js";
import { CreateReviewDto } from "../models/review.dto.js";

@Controller("api/v1/reviews")
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get("health")
  healthCheck() {
    return { status: "UP", service: "review-service", engine: "NestJS + MongoDB (Mongoose)", port: 8009 };
  }

  @Get("hotel/:hotelId")
  getByHotel(@Param("hotelId") hotelId: string) {
    return this.reviewService.getHotelReviews(hotelId);
  }

  @Get("admin")
  getAdminReviews(@Req() request: Request & { user?: { role?: string } }) {
    if (request.user?.role !== "ADMIN") throw new ForbiddenException("Administrator access required");
    return this.reviewService.getAdminReviews();
  }

  @Get("hotel/:hotelId/stats")
  getHotelStats(@Param("hotelId") hotelId: string) {
    return this.reviewService.getHotelStats(hotelId);
  }

  @Post()
  createReview(@Body() dto: CreateReviewDto) {
    return this.reviewService.createReview(dto);
  }

  @Post(":id/helpful")
  markHelpful(@Param("id") id: string) {
    return this.reviewService.markHelpful(id);
  }
}

