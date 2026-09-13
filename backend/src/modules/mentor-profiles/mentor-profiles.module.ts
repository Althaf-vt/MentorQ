import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MentorProfile, MentorProfileSchema } from './schemas/mentor-profile.schema.js';
import { MentorProfilesRepository } from './repositories/mentor-profiles.repository.js';
import { MentorProfilesService } from './services/mentor-profiles.service.js';
import { MentorProfilesController } from './controllers/mentor-profiles.controller.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: MentorProfile.name, schema: MentorProfileSchema }]),
  ],
  controllers: [MentorProfilesController],
  providers: [MentorProfilesService, MentorProfilesRepository],
  exports: [MentorProfilesService, MentorProfilesRepository],
})
export class MentorProfilesModule {}
