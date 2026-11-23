import { ReviewModel } from '../types/review.type.js';
import { ReviewResponseDto } from '../dto/review-response.dto.js';

export class ReviewDtoMapper {
  static toResponseDto(model: ReviewModel): ReviewResponseDto {
    return {
      id: model.id,
      sessionId: model.sessionId,
      studentId: model.studentId,
      mentorId: model.mentorId,
      rating: model.rating,
      feedbackText: model.feedbackText,
      createdAt: model.createdAt ? model.createdAt.toISOString() : undefined,
      updatedAt: model.updatedAt ? model.updatedAt.toISOString() : undefined,
    };
  }

  static toResponseDtoList(models: ReviewModel[]): ReviewResponseDto[] {
    return models.map((m) => this.toResponseDto(m));
  }
}
