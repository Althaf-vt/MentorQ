import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review, ReviewDocument } from '../schemas/review.schema.js';
import { IReviewsRepository } from './reviews.repository.interface.js';
import { ReviewModel, CreateReviewInput } from '../types/review.type.js';
import { ReviewSchemaMapper } from './mappers/review.schema-mapper.js';

@Injectable()
export class ReviewsRepository implements IReviewsRepository {
  constructor(
    @InjectModel(Review.name) private readonly reviewModel: Model<ReviewDocument>,
  ) {}

  async create(review: CreateReviewInput): Promise<ReviewModel> {
    const newReview = new this.reviewModel({
      session_id: new Types.ObjectId(review.sessionId),
      student_id: new Types.ObjectId(review.studentId),
      mentor_id: new Types.ObjectId(review.mentorId),
      rating: review.rating,
      feedback_text: review.feedbackText,
    });
    const saved = await newReview.save();
    return ReviewSchemaMapper.toDomain(saved as ReviewDocument);
  }

  async findByMentor(mentorId: string): Promise<ReviewModel[]> {
    const query: Record<string, unknown> = { mentor_id: mentorId };
    const docs = await this.reviewModel
      .find(query)
      .sort({ createdAt: -1 })
      .exec();
    return ReviewSchemaMapper.toDomainList(docs as ReviewDocument[]);
  }

  async findBySession(sessionId: string): Promise<ReviewModel | null> {
    const query: Record<string, unknown> = { session_id: sessionId };
    const doc = await this.reviewModel.findOne(query).exec();
    return doc ? ReviewSchemaMapper.toDomain(doc as ReviewDocument) : null;
  }

  async getAverageRatingForMentor(mentorId: string): Promise<number> {
    const matchTarget = Types.ObjectId.isValid(mentorId)
      ? new Types.ObjectId(mentorId)
      : mentorId;
    const res = await this.reviewModel.aggregate([
      { $match: { mentor_id: matchTarget } },
      { $group: { _id: '$mentor_id', avgRating: { $avg: '$rating' } } },
    ]);
    return res[0]?.avgRating || 0;
  }
}
