import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Review, ReviewDocument } from '../schemas/review.schema.js';
import { IReviewsRepository } from './reviews.repository.interface.js';
import { ReviewModel } from '../types/review.type.js';
import { ReviewSchemaMapper } from './mappers/review.schema-mapper.js';

@Injectable()
export class ReviewsRepository implements IReviewsRepository {
  constructor(
    @InjectModel(Review.name) private readonly reviewModel: Model<ReviewDocument>,
  ) {}

  async create(review: Partial<Review>): Promise<ReviewModel> {
    const newReview = new this.reviewModel(review);
    const saved = await newReview.save();
    return ReviewSchemaMapper.toDomain(saved);
  }

  async findByMentor(mentorId: string): Promise<ReviewModel[]> {
    const docs = await this.reviewModel
      .find({ mentor_id: mentorId as any })
      .sort({ createdAt: -1 })
      .exec();
    return ReviewSchemaMapper.toDomainList(docs);
  }

  async findBySession(sessionId: string): Promise<ReviewModel | null> {
    const doc = await this.reviewModel.findOne({ session_id: sessionId as any }).exec();
    return doc ? ReviewSchemaMapper.toDomain(doc) : null;
  }

  async getAverageRatingForMentor(mentorId: string): Promise<number> {
    const res = await this.reviewModel.aggregate([
      { $match: { mentor_id: mentorId as any } },
      { $group: { _id: '$mentor_id', avgRating: { $avg: '$rating' } } },
    ]);
    return res[0]?.avgRating || 0;
  }
}
