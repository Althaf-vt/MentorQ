import { Review, ReviewDocument } from '../schemas/review.schema.js';

export const REVIEWS_REPOSITORY = Symbol('REVIEWS_REPOSITORY');

export interface IReviewsRepository {
  create(review: Partial<Review>): Promise<ReviewDocument>;
  findByMentor(mentorId: string): Promise<ReviewDocument[]>;
  findBySession(sessionId: string): Promise<ReviewDocument | null>;
  getAverageRatingForMentor(mentorId: string): Promise<number>;
}
