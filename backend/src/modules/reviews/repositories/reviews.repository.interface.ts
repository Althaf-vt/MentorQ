import { Review } from '../schemas/review.schema.js';
import { ReviewModel } from '../types/review.type.js';

export const REVIEWS_REPOSITORY = Symbol('REVIEWS_REPOSITORY');

export interface IReviewsRepository {
  create(review: Partial<Review>): Promise<ReviewModel>;
  findByMentor(mentorId: string): Promise<ReviewModel[]>;
  findBySession(sessionId: string): Promise<ReviewModel | null>;
  getAverageRatingForMentor(mentorId: string): Promise<number>;
}
