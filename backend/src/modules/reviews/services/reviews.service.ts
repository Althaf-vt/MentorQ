import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { ReviewsRepository } from '../repositories/reviews.repository.js';
import { SessionsRepository } from '../../sessions/repositories/sessions.repository.js';
import { MentorProfilesRepository } from '../../mentor-profiles/repositories/mentor-profiles.repository.js';
import { ReviewDocument } from '../schemas/review.schema.js';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly reviewsRepository: ReviewsRepository,
    private readonly sessionsRepository: SessionsRepository,
    private readonly mentorProfilesRepository: MentorProfilesRepository,
  ) {}

  async createReview(
    sessionId: string,
    studentId: string,
    rating: number,
    feedbackText?: string,
  ): Promise<ReviewDocument> {
    const session = await this.sessionsRepository.findById(sessionId);
    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.student_id.toString() !== studentId) {
      throw new BadRequestException('Only the student of this session can submit a review');
    }

    if (session.session_status !== 'COMPLETED') {
      throw new BadRequestException('Reviews can only be submitted for completed sessions');
    }

    const existingReview = await this.reviewsRepository.findBySession(sessionId);
    if (existingReview) {
      throw new ConflictException('A review has already been submitted for this session');
    }

    const review = await this.reviewsRepository.create({
      session_id: sessionId as any,
      student_id: studentId as any,
      mentor_id: session.mentor_id as any,
      rating,
      feedback_text: feedbackText,
    });

    // Recalculate and update mentor's average rating
    const mentorIdStr = session.mentor_id.toString();
    const avgRating = await this.reviewsRepository.getAverageRatingForMentor(mentorIdStr);
    
    const profile = await this.mentorProfilesRepository.findByUserId(mentorIdStr);
    if (profile) {
      await this.mentorProfilesRepository.update(mentorIdStr, { rating_avg: avgRating });
    }

    return review;
  }

  async getMentorReviews(mentorId: string): Promise<ReviewDocument[]> {
    return this.reviewsRepository.findByMentor(mentorId);
  }

  async getSessionReview(sessionId: string): Promise<ReviewDocument | null> {
    return this.reviewsRepository.findBySession(sessionId);
  }
}
