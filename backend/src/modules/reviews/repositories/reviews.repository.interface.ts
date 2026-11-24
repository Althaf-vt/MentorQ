import { ReviewModel, CreateReviewInput } from '../types/review.type.js';

export const REVIEWS_REPOSITORY = Symbol('REVIEWS_REPOSITORY');

export interface IReviewsRepository {
  create(review: CreateReviewInput): Promise<ReviewModel>;
  findByMentor(mentorId: string): Promise<ReviewModel[]>;
  findBySession(sessionId: string): Promise<ReviewModel | null>;
  getAverageRatingForMentor(mentorId: string): Promise<number>;
}
