import { UpdateQuery } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema.js';

export const USERS_REPOSITORY = Symbol('USERS_REPOSITORY');

export interface IUsersRepository {
  create(user: Partial<User>): Promise<UserDocument>;
  findById(id: string): Promise<UserDocument | null>;
  findByEmail(email: string): Promise<UserDocument | null>;
  findByIdPopulated(id: string, populateField: string): Promise<UserDocument | null>;
  update(id: string, update: UpdateQuery<UserDocument>): Promise<UserDocument | null>;
  addFavoriteMentor(userId: string, mentorId: string): Promise<UserDocument | null>;
  removeFavoriteMentor(userId: string, mentorId: string): Promise<UserDocument | null>;
  countDocuments(query: any): Promise<number>;
  findPaginated(
    query: any,
    skip: number,
    limit: number,
  ): Promise<{ users: UserDocument[]; total: number }>;
  getMentorsDirectory(): Promise<any[]>;
}
