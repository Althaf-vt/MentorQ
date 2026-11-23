import {
  Controller, Get, Patch, Post, Delete, Body, Param,
  UseGuards, UseInterceptors, UploadedFile, Req, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, unlinkSync } from 'fs';
import { UsersService } from '../services/users.service.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { UpdateUserDto } from '../dto/update-user.dto.js';
import { UserDtoMapper } from '../mappers/user.dto-mapper.js';
import type { AuthenticatedRequest } from '../../../common/types/authenticated-request.type.js';

const AVATAR_DEST = join(process.cwd(), 'uploads', 'avatars');

@Controller('api/v1/users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@Req() req: AuthenticatedRequest) {
    const user = await this.usersService.findById(req.user.id);
    return { status: 'success', data: UserDtoMapper.toResponseDto(user) };
  }

  @Patch('me')
  async updateMe(@Req() req: AuthenticatedRequest, @Body() updateData: UpdateUserDto) {
    const user = await this.usersService.updateProfile(req.user.id, updateData);
    return { status: 'success', data: UserDtoMapper.toResponseDto(user) };
  }

  @Post('favorites/:mentorId')
  async addFavorite(@Req() req: AuthenticatedRequest, @Param('mentorId') mentorId: string) {
    // req.user.id is the authenticated STUDENT — mentorId is from the URL param
    const user = await this.usersService.addFavorite(req.user.id, mentorId);
    return { status: 'success', data: UserDtoMapper.toResponseDto(user) };
  }

  @Delete('favorites/:mentorId')
  async removeFavorite(@Req() req: AuthenticatedRequest, @Param('mentorId') mentorId: string) {
    // req.user.id is the authenticated STUDENT — mentorId is from the URL param
    const user = await this.usersService.removeFavorite(req.user.id, mentorId);
    return { status: 'success', data: UserDtoMapper.toResponseDto(user) };
  }

  @Get('me/favorites')
  async getMyFavorites(@Req() req: AuthenticatedRequest) {
    const user = await this.usersService.findByIdWithFavorites(req.user.id);
    const populatedFavorites = UserDtoMapper.toFavoriteList(user.favoriteMentors || []);
    return { status: 'success', data: populatedFavorites };
  }

  @Get('mentors/directory')
  async getMentorsDirectory() {
    const directory = await this.usersService.getMentorsDirectory();
    return { status: 'success', data: UserDtoMapper.toDirectoryList(directory) };
  }

  // ---- Avatar Upload -------------------------------------------------------
  @Post('me/avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: AVATAR_DEST,
        filename: (_req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
          return cb(new BadRequestException('Only JPEG, PNG, and WebP image files are allowed'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    }),
  )
  async uploadAvatar(@Req() req: AuthenticatedRequest, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Delete old avatar file if one exists
    const currentUser = await this.usersService.findById(req.user.id);
    if (currentUser.avatarUrl) {
      const oldPath = join(process.cwd(), currentUser.avatarUrl.replace(/^\//, ''));
      if (existsSync(oldPath)) {
        unlinkSync(oldPath);
      }
    }

    const avatarUrl = `/uploads/avatars/${file.filename}`;
    const user = await this.usersService.updateAvatar(req.user.id, avatarUrl);
    return { status: 'success', data: UserDtoMapper.toResponseDto(user) };
  }

  // ---- Avatar Delete -------------------------------------------------------
  @Delete('me/avatar')
  async deleteAvatar(@Req() req: AuthenticatedRequest) {
    const currentUser = await this.usersService.findById(req.user.id);

    if (currentUser.avatarUrl) {
      const filePath = join(process.cwd(), currentUser.avatarUrl.replace(/^\//, ''));
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    }

    const user = await this.usersService.updateAvatar(req.user.id, null);
    return { status: 'success', data: UserDtoMapper.toResponseDto(user) };
  }
}
