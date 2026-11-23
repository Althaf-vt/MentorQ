import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ReviewsService } from '../services/reviews.service.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { CreateReviewDto } from '../dto/create-review.dto.js';
import type { AuthenticatedRequest } from '../../../common/types/authenticated-request.type.js';
import { ReviewDtoMapper } from '../mappers/review.dto-mapper.js';
import { ReviewResponseDto } from '../dto/review-response.dto.js';

@Controller('api/v1/reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createReview(
    @Body() createReviewDto: CreateReviewDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ReviewResponseDto> {
    const review = await this.reviewsService.createReview(
      createReviewDto.sessionId,
      req.user.id,
      createReviewDto.rating,
      createReviewDto.feedbackText,
    );
    return ReviewDtoMapper.toResponseDto(review);
  }

  @Get('mentor/:mentorId')
  async getMentorReviews(@Param('mentorId') mentorId: string): Promise<ReviewResponseDto[]> {
    const reviews = await this.reviewsService.getMentorReviews(mentorId);
    return ReviewDtoMapper.toResponseDtoList(reviews);
  }

  @Get('session/:sessionId')
  async getSessionReview(@Param('sessionId') sessionId: string): Promise<ReviewResponseDto | null> {
    const review = await this.reviewsService.getSessionReview(sessionId);
    return review ? ReviewDtoMapper.toResponseDto(review) : null;
  }
}
