import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { MulterModule } from '@nestjs/platform-express';
import { join } from 'path';
import { User, UserSchema } from './schemas/user.schema.js';
import { UsersRepository } from './repositories/users.repository.js';
import { USERS_REPOSITORY } from './repositories/users.repository.interface.js';
import { UsersService } from './services/users.service.js';
import { AvatarStorageService } from './services/avatar-storage.service.js';
import { UsersController } from './controllers/users.controller.js';
import { MentorProfilesModule } from '../mentor-profiles/mentor-profiles.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    MulterModule.register({ dest: join(process.cwd(), 'uploads', 'avatars') }),
    MentorProfilesModule,
  ],
  controllers: [UsersController],
  providers: [
    {
      provide: USERS_REPOSITORY,
      useClass: UsersRepository,
    },
    UsersService,
    AvatarStorageService,
  ],
  exports: [UsersService, AvatarStorageService],
})
export class UsersModule {}
