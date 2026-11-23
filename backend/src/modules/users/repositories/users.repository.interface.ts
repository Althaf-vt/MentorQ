import {
  UserModel,
  CreateUserInput,
  UpdateUserProfileInput,
} from '../types/user.type.js';

export const USERS_REPOSITORY = Symbol('USERS_REPOSITORY');

export interface IUsersRepository {
  create(input: CreateUserInput): Promise<UserModel>;
  findById(id: string): Promise<UserModel | null>;
  findByEmail(email: string): Promise<UserModel | null>;
  findByIdPopulated(id: string, populateField: string): Promise<UserModel | null>;
  updateProfile(id: string, input: UpdateUserProfileInput): Promise<UserModel | null>;
  updateAvatarUrl(id: string, avatarUrl: string | null): Promise<UserModel | null>;
  updateStatus(id: string, status: string): Promise<UserModel | null>;
  updateOnlineStatus(id: string, isOnline: boolean): Promise<void>;
  verify(id: string): Promise<UserModel | null>;
  addFavoriteMentor(userId: string, mentorId: string): Promise<UserModel | null>;
  removeFavoriteMentor(userId: string, mentorId: string): Promise<UserModel | null>;
  countDocuments(query: Record<string, unknown>): Promise<number>;
  findPaginated(
    query: Record<string, unknown>,
    skip: number,
    limit: number,
  ): Promise<{ users: UserModel[]; total: number }>;
  findMentors(): Promise<UserModel[]>;
}
