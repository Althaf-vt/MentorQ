import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Review, ReviewDocument } from '../schemas/review.schema.js';

@Injectable()
export class ReviewsRepository {
  constructor(
    @InjectModel(Review.name) private readonly reviewModel: Model<ReviewDocument>,
  ) {}

  async create(review: Partial<Review>): Promise<ReviewDocument> {
    const newReview = new this.reviewModel(review);
    return newReview.save();
  }

  async findByMentor(mentorId: string): Promise<ReviewDocument[]> {
    return this.reviewModel
      .find({ mentor_id: mentorId as any })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findBySession(sessionId: string): Promise<ReviewDocument | null> {
    return this.reviewModel.findOne({ session_id: sessionId as any }).exec();
  }

  async getAverageRatingForMentor(mentorId: string): Promise<number> {
    const res = await this.reviewModel.aggregate([
      { $match: { mentor_id: mentorId as any } },
      { $group: { _id: '$mentor_id', avgRating: { $avg: '$rating' } } },
    ]);
    return res[0]?.avgRating || 0;
  }
}
