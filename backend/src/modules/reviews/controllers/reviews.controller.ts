import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ReviewsService } from '../services/reviews.service.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createReview(
    @Body('sessionId') sessionId: string,
    @Body('rating') rating: number,
    @Body('feedbackText') feedbackText: string,
    @Request() req: any,
  ) {
    return this.reviewsService.createReview(sessionId, req.user.id, rating, feedbackText);
  }

  @Get('mentor/:mentorId')
  async getMentorReviews(@Param('mentorId') mentorId: string) {
    return this.reviewsService.getMentorReviews(mentorId);
  }

  @Get('session/:sessionId')
  async getSessionReview(@Param('sessionId') sessionId: string) {
    return this.reviewsService.getSessionReview(sessionId);
  }
}
