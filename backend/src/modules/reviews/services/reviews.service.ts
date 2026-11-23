import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AppException, ErrorCode } from '../../../common/exceptions/app.exception.js';
import {
  REVIEWS_REPOSITORY,
  type IReviewsRepository,
} from '../repositories/reviews.repository.interface.js';
import { SessionsService } from '../../sessions/services/sessions.service.js';
import { ReviewModel } from '../types/review.type.js';
import {
  REVIEW_EVENTS,
  ReviewCreatedEvent,
} from '../events/review.events.js';
import { SESSION_STATUS } from '../../sessions/constants/sessions.constants.js';
import { REVIEW_ERROR_MESSAGES } from '../constants/reviews.constants.js';

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
  ): Promise<ReviewModel> {
    const session = await this.sessionsService.getSessionById(sessionId);
    if (!session) {
      throw new AppException(ErrorCode.SESSION_NOT_FOUND, REVIEW_ERROR_MESSAGES.SESSION_NOT_FOUND);
    }

    if (session.studentId !== studentId) {
      throw new AppException(ErrorCode.ONLY_STUDENT_CAN_REVIEW, REVIEW_ERROR_MESSAGES.ONLY_STUDENT_CAN_REVIEW);
    }

    if (session.sessionStatus !== SESSION_STATUS.COMPLETED) {
      throw new AppException(ErrorCode.SESSION_NOT_COMPLETED, REVIEW_ERROR_MESSAGES.SESSION_NOT_COMPLETED);
    }

    const existingReview = await this.reviewsRepository.findBySession(sessionId);
    if (existingReview) {
      throw new AppException(ErrorCode.REVIEW_ALREADY_SUBMITTED, REVIEW_ERROR_MESSAGES.REVIEW_ALREADY_SUBMITTED);
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
        review.id,
        mentorIdStr,
        rating,
        avgRating,
      ),
    );

    return review;
  }

  async getMentorReviews(mentorId: string): Promise<ReviewModel[]> {
    return this.reviewsRepository.findByMentor(mentorId);
  }

  async getSessionReview(sessionId: string): Promise<ReviewModel | null> {
    return this.reviewsRepository.findBySession(sessionId);
  }
}
