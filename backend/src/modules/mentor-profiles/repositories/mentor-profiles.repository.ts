import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MentorProfile, MentorProfileDocument } from '../schemas/mentor-profile.schema.js';
import { IMentorProfilesRepository } from './mentor-profiles.repository.interface.js';
import {
  MentorProfileModel,
  CreateMentorProfileInput,
  UpdateMentorProfileInput,
} from '../types/mentor-profile.type.js';
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

  async create(profile: CreateMentorProfileInput): Promise<MentorProfileModel> {
    const newProfile = new this.mentorProfileModel({
      user_id: Types.ObjectId.isValid(profile.userId) ? new Types.ObjectId(profile.userId) : profile.userId,
      expertise_tags: profile.expertiseTags || [],
      daily_available_minutes: profile.dailyAvailableMinutes,
      remaining_minutes_today: profile.remainingMinutesToday,
      is_online: profile.isOnline ?? true,
      rating_avg: profile.ratingAvg ?? 0,
      operating_hours: profile.operatingHours,
    });
    const saved = await newProfile.save();
    return MentorProfileSchemaMapper.toDomain(saved);
  }

  async findByUserId(userId: string): Promise<MentorProfileModel | null> {
    const doc = await this.mentorProfileModel.findOne(this.buildUserFilter(userId)).exec();
    return doc ? MentorProfileSchemaMapper.toDomain(doc) : null;
  }

  async findByUserIds(userIds: string[]): Promise<MentorProfileModel[]> {
    const objectIds = userIds
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));

    const filter: Record<string, unknown> = {
      $or: [
        { user_id: { $in: objectIds } },
        { user_id: { $in: userIds } },
      ],
    };

    const docs = await this.mentorProfileModel.find(filter).exec();
    return MentorProfileSchemaMapper.toDomainList(docs as unknown as MentorProfileDocument[]);
  }

  async upsertProfile(
    userId: string,
    updateData: UpdateMentorProfileInput,
    defaults: CreateMentorProfileInput,
  ): Promise<MentorProfileModel | null> {
    const filter = this.buildUserFilter(userId);
    const existing = await this.mentorProfileModel.findOne(filter).exec();

    const cleanUpdate: Record<string, unknown> = {};
    if (updateData.isOnline !== undefined) cleanUpdate.is_online = updateData.isOnline;
    if (updateData.dailyAvailableMinutes !== undefined) cleanUpdate.daily_available_minutes = updateData.dailyAvailableMinutes;
    if (updateData.remainingMinutesToday !== undefined) cleanUpdate.remaining_minutes_today = updateData.remainingMinutesToday;
    if (updateData.expertiseTags !== undefined) cleanUpdate.expertise_tags = updateData.expertiseTags;
    if (updateData.operatingHours !== undefined) cleanUpdate.operating_hours = updateData.operatingHours;
    if (updateData.ratingAvg !== undefined) cleanUpdate.rating_avg = updateData.ratingAvg;

    if (existing) {
      const updated = await this.mentorProfileModel.findByIdAndUpdate(
        existing._id,
        { $set: cleanUpdate },
        { returnDocument: 'after' },
      ).exec();
      return updated ? MentorProfileSchemaMapper.toDomain(updated) : null;
    }

    const userObjectId = Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : userId;
    const upserted = await this.mentorProfileModel.findOneAndUpdate(
      filter,
      {
        $set: cleanUpdate,
        $setOnInsert: {
          user_id: userObjectId,
          expertise_tags: defaults.expertiseTags || [],
          daily_available_minutes: defaults.dailyAvailableMinutes,
          remaining_minutes_today: defaults.remainingMinutesToday,
          is_online: defaults.isOnline ?? true,
          rating_avg: defaults.ratingAvg ?? 0,
          operating_hours: defaults.operatingHours,
        },
      },
      { upsert: true, returnDocument: 'after' },
    ).exec();
    return upserted ? MentorProfileSchemaMapper.toDomain(upserted as MentorProfileDocument) : null;
  }

  async updateRating(userId: string, ratingAvg: number): Promise<void> {
    await this.mentorProfileModel.findOneAndUpdate(
      this.buildUserFilter(userId),
      { rating_avg: ratingAvg },
    ).exec();
  }

  async findAllOnline(): Promise<MentorProfileModel[]> {
    const docs = await this.mentorProfileModel.find({ is_online: true }).exec();
    return MentorProfileSchemaMapper.toDomainList(docs);
  }
}
