export type TicketStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'

export interface TicketStatusHistory {
  status: string
  timestamp: string
  feedback_note?: string
}

export interface Ticket {
  _id: string
  student_id: string | { _id: string; fullName: string; email: string }
  mentor_id?: string | { _id: string; fullName: string; email: string }
  topic: string
  description: string
  requested_minutes: number
  status: TicketStatus
  scheduled_time?: string
  actual_time_spent_minutes?: number
  tags: string[]
  status_history: TicketStatusHistory[]
  createdAt: string
  updatedAt: string
}

export type SessionStatus = 'ACTIVE' | 'COMPLETED' | 'TERMINATED'

export interface Session {
  _id: string
  ticket_id: string | Ticket
  mentor_id: string | { _id: string; fullName: string; email: string }
  student_id: string | { _id: string; fullName: string; email: string }
  started_at: string
  allocated_minutes: number
  extended_minutes: number
  ended_at?: string
  actual_duration_minutes?: number
  session_status: SessionStatus
  resolution_notes?: string
  createdAt: string
  updatedAt: string
}

export interface Message {
  _id: string
  session_id: string
  sender_id: string
  message_text: string
  sent_at: string
  read_status: boolean
  createdAt: string
  updatedAt: string
}

export type NotificationType = 'SYSTEM' | 'TICKET' | 'SESSION' | 'REVIEW'

export interface Notification {
  _id: string
  user_id: string
  title: string
  message: string
  type: NotificationType
  read_status: boolean
  createdAt: string
  updatedAt: string
}

export interface Review {
  _id: string
  sessionId: string
  rating: number
  feedbackText: string
  studentId: string
  mentorId: string
  createdAt: string
  updatedAt: string
}
