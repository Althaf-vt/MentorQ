import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MentorProfile, MentorProfileDocument } from '../schemas/mentor-profile.schema.js';
import { IMentorProfilesRepository } from './mentor-profiles.repository.interface.js';
import { MentorProfileModel } from '../types/mentor-profile.type.js';
import { MentorProfileSchemaMapper } from './mappers/mentor-profile.schema-mapper.js';

@Injectable()
export class MentorProfilesRepository implements IMentorProfilesRepository {
  constructor(
    @InjectModel(MentorProfile.name) private readonly mentorProfileModel: Model<MentorProfileDocument>,
  ) {}

  private buildUserFilter(userId: string): Record<string, unknown> {
    if (Types.ObjectId.isValid(userId)) {
      return {
        $or: [
          { user_id: new Types.ObjectId(userId) },
          { user_id: userId },
        ],
      };
    }
    return { user_id: userId };
  }

  async create(profile: Partial<MentorProfile>): Promise<MentorProfileModel> {
    const newProfile = new this.mentorProfileModel(profile);
    const saved = await newProfile.save();
    return MentorProfileSchemaMapper.toDomain(saved);
  }

  async findByUserId(userId: string): Promise<MentorProfileModel | null> {
    const doc = await this.mentorProfileModel.findOne(this.buildUserFilter(userId)).exec();
    return doc ? MentorProfileSchemaMapper.toDomain(doc) : null;
  }

  async update(userId: string, update: any): Promise<MentorProfileModel | null> {
    // 1. Look for existing profile matching either string or ObjectId
    const existing = await this.mentorProfileModel.findOne(this.buildUserFilter(userId)).exec();

    // 2. Separate _id and $unset so we never attempt to overwrite user_id or _id
    const { _id, $unset, ...cleanUpdate } = update as any;
    delete (cleanUpdate as any).user_id;

    const updateQuery: any = { $set: cleanUpdate };
    if ($unset) {
      updateQuery.$unset = $unset;
    }

    if (existing) {
      const updated = await this.mentorProfileModel.findByIdAndUpdate(
        existing._id,
        updateQuery,
        { returnDocument: 'after' },
      ).exec();
      return updated ? MentorProfileSchemaMapper.toDomain(updated) : null;
    }

    // 3. If no existing document, perform a safe upsert matching user_id
    const upserted = await this.mentorProfileModel.findOneAndUpdate(
      { user_id: new Types.ObjectId(userId) } as any,
      {
        ...updateQuery,
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
    return upserted ? MentorProfileSchemaMapper.toDomain(upserted as MentorProfileDocument) : null;
  }

  async findAllOnline(): Promise<MentorProfileModel[]> {
    const docs = await this.mentorProfileModel.find({ is_online: true }).exec();
    return MentorProfileSchemaMapper.toDomainList(docs);
  }
}
