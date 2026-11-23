import { Injectable, Inject, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  REVIEWS_REPOSITORY,
  type IReviewsRepository,
} from '../repositories/reviews.repository.interface.js';
import { SessionsService } from '../../sessions/services/sessions.service.js';
import { ReviewDocument } from '../schemas/review.schema.js';
import {
  REVIEW_EVENTS,
  ReviewCreatedEvent,
} from '../events/review.events.js';

@Injectable()
export class ReviewsService {
  constructor(
    @Inject(REVIEWS_REPOSITORY)
    private readonly reviewsRepository: IReviewsRepository,
    private readonly sessionsService: SessionsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createReview(
    sessionId: string,
    studentId: string,
    rating: number,
    feedbackText?: string,
  ): Promise<ReviewDocument> {
    const session = await this.sessionsService.getSessionById(sessionId);
    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.studentId !== studentId) {
      throw new BadRequestException('Only the student of this session can submit a review');
    }

    if (session.sessionStatus !== 'COMPLETED') {
      throw new BadRequestException('Reviews can only be submitted for completed sessions');
    }

    const existingReview = await this.reviewsRepository.findBySession(sessionId);
    if (existingReview) {
      throw new ConflictException('A review has already been submitted for this session');
    }

    const review = await this.reviewsRepository.create({
      session_id: sessionId as any,
      student_id: studentId as any,
      mentor_id: session.mentorId as any,
      rating,
      feedback_text: feedbackText,
    });

    // Recalculate average rating and emit domain event
    const mentorIdStr = session.mentorId;
    const avgRating = await this.reviewsRepository.getAverageRatingForMentor(mentorIdStr);

    this.eventEmitter.emit(
      REVIEW_EVENTS.CREATED,
      new ReviewCreatedEvent(
        review._id.toString(),
        mentorIdStr,
        rating,
        avgRating,
      ),
    );

    return review;
  }

  async getMentorReviews(mentorId: string): Promise<ReviewDocument[]> {
    return this.reviewsRepository.findByMentor(mentorId);
  }

  async getSessionReview(sessionId: string): Promise<ReviewDocument | null> {
    return this.reviewsRepository.findBySession(sessionId);
  }
}
