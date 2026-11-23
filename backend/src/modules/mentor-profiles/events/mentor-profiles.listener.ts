import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MentorProfilesService } from '../services/mentor-profiles.service.js';
import {
  REVIEW_EVENTS,
  ReviewCreatedEvent,
} from '../../reviews/events/review.events.js';

@Injectable()
export class MentorProfilesListener {
  constructor(
    private readonly mentorProfilesService: MentorProfilesService,
  ) {}

  @OnEvent(REVIEW_EVENTS.CREATED)
  async handleReviewCreated(event: ReviewCreatedEvent): Promise<void> {
    await this.mentorProfilesService.updateRating(event.mentorId, event.averageRating);
  }
}
