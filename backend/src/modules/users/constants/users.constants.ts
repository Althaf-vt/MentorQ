export const USER_ROLES = {
  STUDENT: 'STUDENT',
  MENTOR: 'MENTOR',
  ADMIN: 'ADMIN',
} as const;

export type UserRoleType = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const USER_STATUS = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const;

export type UserStatusType = (typeof USER_STATUS)[keyof typeof USER_STATUS];

export const USER_ERROR_MESSAGES = {
  NOT_FOUND: 'User not found',
} as const;

export const USER_POPULATE_FIELDS = {
  FAVORITE_MENTORS: 'favorite_mentors',
} as const;
