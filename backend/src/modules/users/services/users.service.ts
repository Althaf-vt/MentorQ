import { Injectable, Inject } from '@nestjs/common';
import { AppException, ErrorCode } from '../../../common/exceptions/app.exception.js';
import {
  USERS_REPOSITORY,
  type IUsersRepository,
} from '../repositories/users.repository.interface.js';
import {
  UserModel,
  CreateUserInput,
  UserMetricsResponseDto,
  UserStatusResponseDto,
} from '../types/user.type.js';
import { UserDtoMapper } from '../mappers/user.dto-mapper.js';
import { UpdateUserDto } from '../dto/update-user.dto.js';
import { AvatarStorageService } from './avatar-storage.service.js';
import { MentorProfilesService } from '../../mentor-profiles/services/mentor-profiles.service.js';
import { MentorProfileModel } from '../../mentor-profiles/types/mentor-profile.type.js';
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
    private readonly avatarStorageService: AvatarStorageService,
    private readonly mentorProfilesService: MentorProfilesService,
  ) {}

  async createUser(data: CreateUserInput): Promise<UserModel> {
    return this.usersRepository.create(data);
  }

  async verifyUser(id: string): Promise<UserModel> {
    const user = await this.usersRepository.verify(id);
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

  async updateProfile(id: string, updateData: UpdateUserDto): Promise<UserModel> {
    const user = await this.usersRepository.updateProfile(id, {
      fullName: updateData.fullName,
      socialLinks: updateData.socialLinks,
    });
    if (!user) {
      throw new AppException(ErrorCode.USER_NOT_FOUND, USER_ERROR_MESSAGES.NOT_FOUND);
    }
    return user;
  }

  async updateAvatar(id: string, avatarUrl: string | null): Promise<UserModel> {
    const user = await this.usersRepository.updateAvatarUrl(id, avatarUrl);
    if (!user) {
      throw new AppException(ErrorCode.USER_NOT_FOUND, USER_ERROR_MESSAGES.NOT_FOUND);
    }
    return user;
  }

  async changeAvatar(userId: string, filename: string): Promise<UserModel> {
    const currentUser = await this.findById(userId);
    if (currentUser.avatarUrl) {
      this.avatarStorageService.deleteAvatarFile(currentUser.avatarUrl);
    }
    const avatarUrl = this.avatarStorageService.buildAvatarUrl(filename);
    return this.updateAvatar(userId, avatarUrl);
  }

  async removeAvatar(userId: string): Promise<UserModel> {
    const currentUser = await this.findById(userId);
    if (currentUser.avatarUrl) {
      this.avatarStorageService.deleteAvatarFile(currentUser.avatarUrl);
    }
    return this.updateAvatar(userId, null);
  }

  async updateOnlineStatus(id: string, isOnline: boolean): Promise<void> {
    await this.usersRepository.updateOnlineStatus(id, isOnline);
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
    const mentors = await this.usersRepository.findMentors();
    const mentorIds = mentors.map((m) => m.id);
    const profiles = await this.mentorProfilesService.findByUserIds(mentorIds);
    const profileMap = new Map<string, MentorProfileModel>();
    for (const p of profiles) {
      profileMap.set(p.userId, p);
    }

    return mentors.map((mentor) => ({
      ...mentor,
      mentorProfile: profileMap.get(mentor.id) || null,
    }));
  }

  async listUsers(page: number = 1, limit: number = 10, role?: string) {
    const query: Record<string, unknown> = role ? { role } : {};
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

  async updateUserStatus(id: string, status: string): Promise<UserStatusResponseDto> {
    const user = await this.usersRepository.updateStatus(id, status);
    if (!user) {
      throw new AppException(ErrorCode.USER_NOT_FOUND, USER_ERROR_MESSAGES.NOT_FOUND);
    }

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      status: user.status,
    };
  }

  async getUserMetrics(): Promise<UserMetricsResponseDto> {
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
