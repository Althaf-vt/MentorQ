import {
  Controller, Get, Patch, Post, Delete, Body,
  UseGuards, UseInterceptors, UploadedFile, Req, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, unlinkSync } from 'fs';
import { UsersService } from '../services/users.service.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';

const AVATAR_DEST = join(process.cwd(), 'uploads', 'avatars');

/** Shared helper to serialise the user document for the API response. */
function serialiseUser(user: any) {
  return {
    id: user._id,
    fullName: user.full_name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatar_url,
  };
}

@Controller('api/v1/users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@Req() req: any) {
    const user = await this.usersService.findById(req.user.id);
    return { status: 'success', data: serialiseUser(user) };
  }

  @Patch('me')
  async updateMe(@Req() req: any, @Body() updateData: any) {
    const user = await this.usersService.updateProfile(req.user.id, updateData);
    return { status: 'success', data: serialiseUser(user) };
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
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Only image files are allowed'), false);
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
    if (currentUser.avatar_url) {
      const oldPath = join(process.cwd(), currentUser.avatar_url.replace(/^\//, ''));
      if (existsSync(oldPath)) {
        unlinkSync(oldPath);
      }
    }

    const avatarUrl = `/uploads/avatars/${file.filename}`;
    const user = await this.usersService.updateAvatar(req.user.id, avatarUrl);
    return { status: 'success', data: serialiseUser(user) };
  }

  // ---- Avatar Delete -------------------------------------------------------
  @Delete('me/avatar')
  async deleteAvatar(@Req() req: any) {
    const currentUser = await this.usersService.findById(req.user.id);

    if (currentUser.avatar_url) {
      const filePath = join(process.cwd(), currentUser.avatar_url.replace(/^\//, ''));
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    }

    const user = await this.usersService.updateAvatar(req.user.id, null);
    return { status: 'success', data: serialiseUser(user) };
  }
}

