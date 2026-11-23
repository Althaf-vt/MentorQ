export class ReviewCreatedEvent {
  constructor(
    public readonly reviewId: string,
    public readonly mentorId: string,
    public readonly rating: number,
    public readonly averageRating: number,
  ) {}
}

export const REVIEW_EVENTS = {
  CREATED: 'review.created',
} as const;
