import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateReviewDto {
  @IsString()
  @IsNotEmpty({ message: 'Session ID is required.' })
  sessionId: string;

  @IsInt({ message: 'Rating must be an integer.' })
  @Min(1, { message: 'Rating must be at least 1.' })
  @Max(5, { message: 'Rating must not exceed 5.' })
  rating: number;

  @IsOptional()
  @IsString()
  feedbackText?: string;
}
