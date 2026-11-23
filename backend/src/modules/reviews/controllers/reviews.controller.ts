import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ReviewsService } from '../services/reviews.service.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { CreateReviewDto } from '../dto/create-review.dto.js';

@Controller('api/v1/reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createReview(
    @Body() createReviewDto: CreateReviewDto,
    @Request() req: any,
  ) {
    return this.reviewsService.createReview(
      createReviewDto.sessionId,
      req.user.id,
      createReviewDto.rating,
      createReviewDto.feedbackText,
    );
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
