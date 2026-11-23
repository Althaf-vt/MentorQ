export const CHAT_CONSTANTS = {
  MESSAGE_MAX_LENGTH: 2000,
} as const;

export const CHAT_ERROR_MESSAGES = {
  MESSAGE_EMPTY: 'Message text cannot be empty.',
  MESSAGE_TOO_LONG: `Message text cannot exceed ${CHAT_CONSTANTS.MESSAGE_MAX_LENGTH} characters.`,
  SESSION_NOT_FOUND: 'Session not found',
  UNAUTHORIZED_PARTICIPANT:
    'Cannot send message: user is not a participant in this session',
} as const;
