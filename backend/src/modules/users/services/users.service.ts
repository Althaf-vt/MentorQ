import { Injectable, Inject } from '@nestjs/common';
import { AppException, ErrorCode } from '../../../common/exceptions/app.exception.js';
import {
  USERS_REPOSITORY,
  type IUsersRepository,
} from '../repositories/users.repository.interface.js';
import { User } from '../schemas/user.schema.js';
import { UserModel } from '../types/user.type.js';
import { UserDtoMapper } from '../mappers/user.dto-mapper.js';
import {
  USER_ROLES,
  USER_STATUS,
  USER_ERROR_MESSAGES,
  USER_POPULATE_FIELDS,
} from '../constants/users.constants.js';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
  ) {}

  async createUser(data: Partial<User>): Promise<UserModel> {
    return this.usersRepository.create(data);
  }

  async verifyUser(id: string): Promise<UserModel> {
    const user = await this.usersRepository.update(id, { is_verified: true });
    if (!user) {
      throw new AppException(ErrorCode.USER_NOT_FOUND, USER_ERROR_MESSAGES.NOT_FOUND);
    }
    return user;
  }

  async findById(id: string): Promise<UserModel> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new AppException(ErrorCode.USER_NOT_FOUND, USER_ERROR_MESSAGES.NOT_FOUND);
    }
    return user;
  }

  async findByEmail(email: string): Promise<UserModel | null> {
    return this.usersRepository.findByEmail(email);
  }

  async updateProfile(id: string, updateData: any): Promise<UserModel> {
    const user = await this.usersRepository.update(id, updateData);
    if (!user) {
      throw new AppException(ErrorCode.USER_NOT_FOUND, USER_ERROR_MESSAGES.NOT_FOUND);
    }
    return user;
  }

  async updateAvatar(id: string, avatarUrl: string | null): Promise<UserModel> {
    const user = await this.usersRepository.update(id, { avatar_url: avatarUrl });
    if (!user) {
      throw new AppException(ErrorCode.USER_NOT_FOUND, USER_ERROR_MESSAGES.NOT_FOUND);
    }
    return user;
  }

  async updateOnlineStatus(id: string, isOnline: boolean): Promise<void> {
    await this.usersRepository.update(id, { is_online: isOnline });
  }

  async addFavorite(userId: string, mentorId: string): Promise<UserModel> {
    const user = await this.usersRepository.addFavoriteMentor(userId, mentorId);
    if (!user) {
      throw new AppException(ErrorCode.USER_NOT_FOUND, USER_ERROR_MESSAGES.NOT_FOUND);
    }
    return user;
  }

  async removeFavorite(userId: string, mentorId: string): Promise<UserModel> {
    const user = await this.usersRepository.removeFavoriteMentor(userId, mentorId);
    if (!user) {
      throw new AppException(ErrorCode.USER_NOT_FOUND, USER_ERROR_MESSAGES.NOT_FOUND);
    }
    return user;
  }

  async findByIdWithFavorites(id: string): Promise<UserModel> {
    const user = await this.usersRepository.findByIdPopulated(id, USER_POPULATE_FIELDS.FAVORITE_MENTORS);
    if (!user) {
      throw new AppException(ErrorCode.USER_NOT_FOUND, USER_ERROR_MESSAGES.NOT_FOUND);
    }
    return user;
  }

  async getMentorsDirectory(): Promise<any[]> {
    return this.usersRepository.getMentorsDirectory();
  }

  async listUsers(page: number = 1, limit: number = 10, role?: string) {
    const query = role ? { role } : {};
    const skip = (page - 1) * limit;
    const { users, total } = await this.usersRepository.findPaginated(query, skip, limit);

    return {
      data: UserDtoMapper.toSummaryDtoList(users),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateUserStatus(id: string, status: string) {
    const user = await this.usersRepository.update(id, { status });
    if (!user) {
      throw new AppException(ErrorCode.USER_NOT_FOUND, USER_ERROR_MESSAGES.NOT_FOUND);
    }

    return {
      id: user.id,
      full_name: user.fullName,
      email: user.email,
      role: user.role,
      status: user.status,
    };
  }

  async getUserMetrics(): Promise<{
    students: { total: number; suspended: number; active: number };
    mentors: { total: number; suspended: number; active: number };
  }> {
    const [totalStudents, suspendedStudents, totalMentors, suspendedMentors] =
      await Promise.all([
        this.usersRepository.countDocuments({ role: USER_ROLES.STUDENT }),
        this.usersRepository.countDocuments({ role: USER_ROLES.STUDENT, status: USER_STATUS.SUSPENDED }),
        this.usersRepository.countDocuments({ role: USER_ROLES.MENTOR }),
        this.usersRepository.countDocuments({ role: USER_ROLES.MENTOR, status: USER_STATUS.SUSPENDED }),
      ]);

    return {
      students: {
        total: totalStudents,
        suspended: suspendedStudents,
        active: totalStudents - suspendedStudents,
      },
      mentors: {
        total: totalMentors,
        suspended: suspendedMentors,
        active: totalMentors - suspendedMentors,
      },
    };
  }
}


