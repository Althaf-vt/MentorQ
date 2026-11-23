import { UpdateQuery } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema.js';
import { UserModel } from '../types/user.type.js';

export const USERS_REPOSITORY = Symbol('USERS_REPOSITORY');

export interface IUsersRepository {
  create(user: Partial<User>): Promise<UserModel>;
  findById(id: string): Promise<UserModel | null>;
  findByEmail(email: string): Promise<UserModel | null>;
  findByIdPopulated(id: string, populateField: string): Promise<UserModel | null>;
  update(id: string, update: UpdateQuery<UserDocument>): Promise<UserModel | null>;
  addFavoriteMentor(userId: string, mentorId: string): Promise<UserModel | null>;
  removeFavoriteMentor(userId: string, mentorId: string): Promise<UserModel | null>;
  countDocuments(query: any): Promise<number>;
  findPaginated(
    query: any,
    skip: number,
    limit: number,
  ): Promise<{ users: UserModel[]; total: number }>;
  getMentorsDirectory(): Promise<any[]>;
}
