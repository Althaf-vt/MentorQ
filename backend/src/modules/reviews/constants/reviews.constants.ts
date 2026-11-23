export const REVIEW_CONFIG = {
  MIN_RATING: 1,
  MAX_RATING: 5,
} as const;

export const REVIEW_ERROR_MESSAGES = {
  SESSION_NOT_FOUND: 'Session not found',
  ONLY_STUDENT_CAN_REVIEW: 'Only the student of this session can submit a review',
  SESSION_NOT_COMPLETED: 'Reviews can only be submitted for completed sessions',
  REVIEW_ALREADY_SUBMITTED: 'A review has already been submitted for this session',
} as const;
