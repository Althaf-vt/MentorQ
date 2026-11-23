import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { Review, ReviewSchema } from './schemas/review.schema.js';
import { ReviewsRepository } from './repositories/reviews.repository.js';
import { REVIEWS_REPOSITORY } from './repositories/reviews.repository.interface.js';
import { ReviewsService } from './services/reviews.service.js';
import { ReviewsController } from './controllers/reviews.controller.js';
import { SessionsModule } from '../sessions/sessions.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Review.name, schema: ReviewSchema }]),
    SessionsModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [ReviewsController],
  providers: [
    {
      provide: REVIEWS_REPOSITORY,
      useClass: ReviewsRepository,
    },
    ReviewsService,
  ],
  exports: [ReviewsService],
})
export class ReviewsModule {}
