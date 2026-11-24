import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema.js';
import { IUsersRepository } from './users.repository.interface.js';
import {
  UserModel,
  CreateUserInput,
  UpdateUserProfileInput,
} from '../types/user.type.js';
import { UserSchemaMapper } from './mappers/user.schema-mapper.js';

@Injectable()
export class UsersRepository implements IUsersRepository {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async create(input: CreateUserInput): Promise<UserModel> {
    const newUser = new this.userModel(input);
    const saved = await newUser.save();
    return UserSchemaMapper.toDomain(saved);
  }

  async findById(id: string): Promise<UserModel | null> {
    const doc = await this.userModel.findById(id).exec();
    return doc ? UserSchemaMapper.toDomain(doc) : null;
  }

  async findByEmail(email: string): Promise<UserModel | null> {
    const doc = await this.userModel.findOne({ email }).exec();
    return doc ? UserSchemaMapper.toDomain(doc) : null;
  }

  async findByIdPopulated(id: string, populateField: string): Promise<UserModel | null> {
    const doc = await this.userModel.findById(id).populate(populateField).exec();
    return doc ? UserSchemaMapper.toDomain(doc) : null;
  }

  async verify(id: string): Promise<UserModel | null> {
    const updated = await this.userModel
      .findByIdAndUpdate(
        id,
        { $set: { is_verified: true } },
        { returnDocument: 'after' },
      )
      .exec();
    return updated ? UserSchemaMapper.toDomain(updated) : null;
  }

  async updateProfile(id: string, input: UpdateUserProfileInput): Promise<UserModel | null> {
    const updateOps: Record<string, unknown> = {};
    if (input.fullName !== undefined) {
      updateOps.full_name = input.fullName;
    }
    if (input.socialLinks !== undefined) {
      updateOps.social_links = input.socialLinks;
    }
    const updated = await this.userModel
      .findByIdAndUpdate(id, { $set: updateOps }, { returnDocument: 'after' })
      .exec();
    return updated ? UserSchemaMapper.toDomain(updated) : null;
  }

  async updateAvatarUrl(id: string, avatarUrl: string | null): Promise<UserModel | null> {
    const updated = await this.userModel
      .findByIdAndUpdate(
        id,
        { $set: { avatar_url: avatarUrl } },
        { returnDocument: 'after' },
      )
      .exec();
    return updated ? UserSchemaMapper.toDomain(updated) : null;
  }

  async updateStatus(id: string, status: string): Promise<UserModel | null> {
    const updated = await this.userModel
      .findByIdAndUpdate(
        id,
        { $set: { status } },
        { returnDocument: 'after' },
      )
      .exec();
    return updated ? UserSchemaMapper.toDomain(updated) : null;
  }

  async updateOnlineStatus(id: string, isOnline: boolean): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(id, { $set: { is_online: isOnline } })
      .exec();
  }

  async addFavoriteMentor(userId: string, mentorId: string): Promise<UserModel | null> {
    const objectId = new Types.ObjectId(mentorId);
    const updated = await this.userModel
      .findByIdAndUpdate(
        userId,
        { $addToSet: { favorite_mentors: objectId } },
        { returnDocument: 'after' },
      )
      .exec();
    return updated ? UserSchemaMapper.toDomain(updated) : null;
  }

  async removeFavoriteMentor(userId: string, mentorId: string): Promise<UserModel | null> {
    const objectId = new Types.ObjectId(mentorId);
    const updated = await this.userModel
      .findByIdAndUpdate(
        userId,
        { $pull: { favorite_mentors: objectId } },
        { returnDocument: 'after' },
      )
      .exec();
    return updated ? UserSchemaMapper.toDomain(updated) : null;
  }

  async countDocuments(query: Record<string, unknown>): Promise<number> {
    return this.userModel.countDocuments(query).exec();
  }

  async findPaginated(
    query: Record<string, unknown>,
    skip: number,
    limit: number,
  ): Promise<{ users: UserModel[]; total: number }> {
    const [users, total] = await Promise.all([
      this.userModel.find(query).skip(skip).limit(limit).exec(),
      this.userModel.countDocuments(query).exec(),
    ]);
    return { users: UserSchemaMapper.toDomainList(users), total };
  }

  async findMentors(): Promise<UserModel[]> {
    const docs = await this.userModel.find({ role: 'MENTOR' }).exec();
    return UserSchemaMapper.toDomainList(docs);
  }
}
