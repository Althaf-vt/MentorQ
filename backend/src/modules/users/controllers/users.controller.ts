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

const AVATAR_DEST = join(process.cwd(), 'uploads', 'avatars');

@Controller('api/v1/users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@Req() req: any) {
    const user = await this.usersService.findById(req.user.id);
    return { status: 'success', data: UserDtoMapper.toResponseDto(user) };
  }

  @Patch('me')
  async updateMe(@Req() req: any, @Body() updateData: UpdateUserDto) {
    const user = await this.usersService.updateProfile(req.user.id, updateData);
    return { status: 'success', data: UserDtoMapper.toResponseDto(user) };
  }

  @Post('favorites/:mentorId')
  async addFavorite(@Req() req: any, @Param('mentorId') mentorId: string) {
    // req.user.id is the authenticated STUDENT — mentorId is from the URL param
    const user = await this.usersService.addFavorite(req.user.id, mentorId);
    return { status: 'success', data: UserDtoMapper.toResponseDto(user) };
  }

  @Delete('favorites/:mentorId')
  async removeFavorite(@Req() req: any, @Param('mentorId') mentorId: string) {
    // req.user.id is the authenticated STUDENT — mentorId is from the URL param
    const user = await this.usersService.removeFavorite(req.user.id, mentorId);
    return { status: 'success', data: UserDtoMapper.toResponseDto(user) };
  }

  @Get('me/favorites')
  async getMyFavorites(@Req() req: any) {
    const user = await this.usersService.findByIdWithFavorites(req.user.id);
    // favorite_mentors is now populated with full User documents
    const populatedFavorites = (user.favoriteMentors || []).map((m: any) =>
      m && (m.id || m._id) ? UserDtoMapper.toResponseDto(m) : m,
    );
    return { status: 'success', data: populatedFavorites };
  }

  @Get('mentors/directory')
  async getMentorsDirectory() {
    const directory = await this.usersService.getMentorsDirectory();
    const mapped = directory.map(d => ({
      ...UserDtoMapper.toResponseDto(d),
      mentorProfile: d.mentorProfile
    }));
    return { status: 'success', data: mapped };
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
  async uploadAvatar(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
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
  async deleteAvatar(@Req() req: any) {
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

