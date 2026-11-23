export const NOTIFICATION_ROLES = {
  SYSTEM: 'SYSTEM',
  STUDENT: 'STUDENT',
  MENTOR: 'MENTOR',
  ADMIN: 'ADMIN',
} as const;

export type NotificationRoleType =
  (typeof NOTIFICATION_ROLES)[keyof typeof NOTIFICATION_ROLES];
