export type UserRole = 'STUDENT' | 'MENTOR' | 'ADMIN'

export interface User {
  id: string
  fullName: string
  email: string
  role: UserRole
  avatarUrl?: string
  headline?: string
  bio?: string
  timezone?: string
  socialLinks?: {
    linkedin?: string
    github?: string
  }
  favoriteMentors?: string[]
  isOnline?: boolean
}

export interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  // Per-role session state
  studentToken: string | null
  studentUser: User | null
  mentorToken: string | null
  mentorUser: User | null
}

export interface LoginRequest {
  email: string
  password: string
  expectedRole?: UserRole
}

export interface RegisterRequest {
  fullName: string
  email: string
  password: string
  role: UserRole
}

export interface AuthResponse {
  access_token: string
  refresh_token?: string
  user: User
}

export interface MentorProfile {
  _id?: string
  user_id: string
  expertise_tags: string[]
  daily_available_minutes: number
  remaining_minutes_today: number
  is_online: boolean
  rating_avg: number
  operating_hours: {
    start: string
    end: string
    timezone: string
  }
  expertise?: string[]
  hourly_rate?: number
  bio?: string
  is_available?: boolean
  max_session_duration?: number
  daily_cap_minutes?: number
  instant_queue_enabled?: boolean
  allow_extensions?: boolean
  enable_pre_chat?: boolean
}
