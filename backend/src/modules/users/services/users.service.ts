import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  USERS_REPOSITORY,
  type IUsersRepository,
} from '../repositories/users.repository.interface.js';
import { User } from '../schemas/user.schema.js';
import { UserModel } from '../types/user.type.js';
import { UserDtoMapper } from '../mappers/user.dto-mapper.js';

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
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findById(id: string): Promise<UserModel> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<UserModel | null> {
    return this.usersRepository.findByEmail(email);
  }

  async updateProfile(id: string, updateData: any): Promise<UserModel> {
    const user = await this.usersRepository.update(id, updateData);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateAvatar(id: string, avatarUrl: string | null): Promise<UserModel> {
    const user = await this.usersRepository.update(id, { avatar_url: avatarUrl });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateOnlineStatus(id: string, isOnline: boolean): Promise<void> {
    await this.usersRepository.update(id, { is_online: isOnline });
  }

  async addFavorite(userId: string, mentorId: string): Promise<UserModel> {
    const user = await this.usersRepository.addFavoriteMentor(userId, mentorId);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async removeFavorite(userId: string, mentorId: string): Promise<UserModel> {
    const user = await this.usersRepository.removeFavoriteMentor(userId, mentorId);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByIdWithFavorites(id: string): Promise<UserModel> {
    const user = await this.usersRepository.findByIdPopulated(id, 'favorite_mentors');
    if (!user) {
      throw new NotFoundException('User not found');
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
      throw new NotFoundException('User not found');
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
        this.usersRepository.countDocuments({ role: 'STUDENT' }),
        this.usersRepository.countDocuments({ role: 'STUDENT', status: 'SUSPENDED' }),
        this.usersRepository.countDocuments({ role: 'MENTOR' }),
        this.usersRepository.countDocuments({ role: 'MENTOR', status: 'SUSPENDED' }),
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


