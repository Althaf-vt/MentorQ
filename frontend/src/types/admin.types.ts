export interface PlatformSettings {
  allowStudentRegistration: boolean;
  allowMentorRegistration: boolean;
  platformName: string;
  platformDescription: string;
  logoUrl: string;
}

export interface UpdatePlatformSettingsRequest {
  allowStudentRegistration?: boolean;
  allowMentorRegistration?: boolean;
  platformName?: string;
  platformDescription?: string;
  logoUrl?: string;
}

export interface AdminMetrics {
  students: {
    total: number;
    suspended: number;
    active: number;
  };
  mentors: {
    total: number;
    suspended: number;
    active: number;
  };
  sessions: {
    total: number;
  };
  tickets: {
    pending: number;
  };
}

export interface AdminUserListItem {
  id: string;
  full_name: string;
  email: string;
  role: 'STUDENT' | 'MENTOR' | 'ADMIN';
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
  is_verified: boolean;
  created_at: string;
}

export interface AdminUserListResponse {
  data: AdminUserListItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface UpdateUserStatusRequest {
  id: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
}
