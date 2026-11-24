export interface CreateReviewInput {
  sessionId: string;
  studentId: string;
  mentorId: string;
  rating: number;
  feedbackText?: string;
}

export interface ReviewModel {
  id: string;
  sessionId: string;
  studentId: string;
  mentorId: string;
  rating: number;
  feedbackText?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
