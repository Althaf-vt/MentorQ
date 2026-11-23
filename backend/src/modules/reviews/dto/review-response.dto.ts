export interface ReviewResponseDto {
  id: string;
  sessionId: string;
  studentId: string;
  mentorId: string;
  rating: number;
  feedbackText?: string;
  createdAt?: string;
  updatedAt?: string;
}
