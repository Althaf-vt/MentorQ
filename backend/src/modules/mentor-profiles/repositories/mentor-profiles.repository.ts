import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MentorProfile, MentorProfileDocument } from '../schemas/mentor-profile.schema.js';

@Injectable()
export class MentorProfilesRepository {
  constructor(
    @InjectModel(MentorProfile.name) private readonly mentorProfileModel: Model<MentorProfileDocument>,
  ) {}

  async create(profile: Partial<MentorProfile>): Promise<MentorProfileDocument> {
    const newProfile = new this.mentorProfileModel(profile);
    return newProfile.save();
  }

  async findByUserId(userId: string): Promise<MentorProfileDocument | null> {
    return this.mentorProfileModel.findOne({ user_id: new Types.ObjectId(userId) }).exec();
  }

  async update(userId: string, update: Partial<MentorProfile>): Promise<MentorProfileDocument | null> {
    return this.mentorProfileModel.findOneAndUpdate(
      { user_id: new Types.ObjectId(userId) },
      update,
      { new: true },
    ).exec();
  }

  async findAllOnline(): Promise<MentorProfileDocument[]> {
    return this.mentorProfileModel.find({ is_online: true }).exec();
  }
}
