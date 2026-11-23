export const SESSION_STATUS = {
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  ABANDONED: 'ABANDONED',
} as const;

export type SessionStatusType = (typeof SESSION_STATUS)[keyof typeof SESSION_STATUS];

export const SESSION_CONFIG = {
  DEFAULT_ALLOCATED_MINUTES: 15,
  STALE_INACTIVITY_THRESHOLD_MS: 15 * 60 * 1000,
  ABANDONED_REASON: 'Automatically abandoned due to inactivity',
} as const;

export const SESSION_ERROR_MESSAGES = {
  NOT_FOUND: 'Session not found',
  NOT_FOUND_DURING_UPDATE: 'Session not found during update',
} as const;
