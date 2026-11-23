import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, UpdateQuery } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema.js';
import { IUsersRepository } from './users.repository.interface.js';
import { UserModel } from '../types/user.type.js';
import { UserSchemaMapper } from './mappers/user.schema-mapper.js';

@Injectable()
export class UsersRepository implements IUsersRepository {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async create(user: Partial<User>): Promise<UserModel> {
    const newUser = new this.userModel(user);
    const saved = await newUser.save();
    return UserSchemaMapper.toDomain(saved);
  }

  async findOne(query: any): Promise<UserModel | null> {
    const doc = await this.userModel.findOne(query).exec();
    return doc ? UserSchemaMapper.toDomain(doc) : null;
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

  async update(id: string, update: UpdateQuery<UserDocument>): Promise<UserModel | null> {
    const updated = await this.userModel.findByIdAndUpdate(id, update, { returnDocument: 'after' }).exec();
    return updated ? UserSchemaMapper.toDomain(updated) : null;
  }

  async addFavoriteMentor(userId: string, mentorId: string): Promise<UserModel | null> {
    const objectId = new Types.ObjectId(mentorId);
    const updated = await this.userModel.findByIdAndUpdate(
      userId,
      { $addToSet: { favorite_mentors: objectId } },
      { returnDocument: 'after' },
    ).exec();
    return updated ? UserSchemaMapper.toDomain(updated) : null;
  }

  async removeFavoriteMentor(userId: string, mentorId: string): Promise<UserModel | null> {
    const objectId = new Types.ObjectId(mentorId);
    const updated = await this.userModel.findByIdAndUpdate(
      userId,
      { $pull: { favorite_mentors: objectId } },
      { returnDocument: 'after' },
    ).exec();
    return updated ? UserSchemaMapper.toDomain(updated) : null;
  }

  async countDocuments(query: any): Promise<number> {
    return this.userModel.countDocuments(query).exec();
  }

  async findPaginated(
    query: any,
    skip: number,
    limit: number,
  ): Promise<{ users: UserModel[]; total: number }> {
    const [users, total] = await Promise.all([
      this.userModel.find(query).skip(skip).limit(limit).exec(),
      this.userModel.countDocuments(query).exec(),
    ]);
    return { users: UserSchemaMapper.toDomainList(users), total };
  }

  async getMentorsDirectory(): Promise<any[]> {
    return this.userModel.aggregate([
      { $match: { role: 'MENTOR' } },
      { $project: { password_hash: 0 } },
      {
        $lookup: {
          from: 'mentorprofiles',
          let: { uId: { $toString: '$_id' } },
          pipeline: [
            { $match: { $expr: { $or: [ { $eq: ['$user_id', '$$uId'] }, { $eq: ['$user_id', '$_id'] } ] } } }
          ],
          as: 'mentorProfile'
        }
      },
      {
        $unwind: { path: '$mentorProfile', preserveNullAndEmptyArrays: true }
      }
    ]).exec();
  }
}
