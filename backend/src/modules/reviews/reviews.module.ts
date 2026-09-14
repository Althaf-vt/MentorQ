import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { Review, ReviewSchema } from './schemas/review.schema.js';
import { ReviewsRepository } from './repositories/reviews.repository.js';
import { ReviewsService } from './services/reviews.service.js';
import { ReviewsController } from './controllers/reviews.controller.js';
import { SessionsModule } from '../sessions/sessions.module.js';
import { MentorProfilesModule } from '../mentor-profiles/mentor-profiles.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Review.name, schema: ReviewSchema }]),
    SessionsModule,
    MentorProfilesModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [ReviewsController],
  providers: [ReviewsRepository, ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
