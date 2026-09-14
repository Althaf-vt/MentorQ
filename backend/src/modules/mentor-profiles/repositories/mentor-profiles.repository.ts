import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MentorProfile, MentorProfileDocument } from '../schemas/mentor-profile.schema.js';

@Injectable()
export class MentorProfilesRepository {
  constructor(
    @InjectModel(MentorProfile.name) private readonly mentorProfileModel: Model<MentorProfileDocument>,
  ) {}

  private buildUserFilter(userId: string) {
    if (Types.ObjectId.isValid(userId)) {
      return { $or: [{ user_id: userId }, { user_id: new Types.ObjectId(userId) }] };
    }
    return { user_id: userId };
  }

  async create(profile: Partial<MentorProfile>): Promise<MentorProfileDocument> {
    const newProfile = new this.mentorProfileModel(profile);
    return newProfile.save();
  }

  async findByUserId(userId: string): Promise<MentorProfileDocument | null> {
    return this.mentorProfileModel.findOne(this.buildUserFilter(userId)).exec();
  }

  async update(userId: string, update: Partial<MentorProfile>): Promise<MentorProfileDocument | null> {
    // 1. Look for existing profile matching either string or ObjectId
    const existing = await this.findByUserId(userId);

    // 2. Separate user_id and _id so we never attempt to overwrite or duplicate user_id
    const { user_id, _id, ...cleanUpdate } = update as any;

    if (existing) {
      return this.mentorProfileModel.findByIdAndUpdate(
        existing._id,
        { $set: cleanUpdate },
        { returnDocument: 'after' },
      ).exec();
    }

    // 3. If no existing document, perform a safe upsert matching user_id
    return this.mentorProfileModel.findOneAndUpdate(
      { user_id: new Types.ObjectId(userId) },
      {
        $set: cleanUpdate,
        $setOnInsert: {
          user_id: new Types.ObjectId(userId),
          expertise_tags: cleanUpdate.expertise_tags || [],
          daily_available_minutes: cleanUpdate.daily_available_minutes ?? 90,
          remaining_minutes_today: cleanUpdate.remaining_minutes_today ?? 90,
          is_online: cleanUpdate.is_online ?? true,
          rating_avg: 0,
          operating_hours: cleanUpdate.operating_hours || {
            start: '09:00 AM',
            end: '06:00 PM',
            timezone: 'Asia/Kolkata',
          },
        },
      },
      { upsert: true, returnDocument: 'after' },
    ).exec();
  }

  async findAllOnline(): Promise<MentorProfileDocument[]> {
    return this.mentorProfileModel.find({ is_online: true }).exec();
  }
}
