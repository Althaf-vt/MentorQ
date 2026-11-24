export interface TicketStatusHistoryItem {
  status: string;
  timestamp: Date;
  feedback_note?: string;
}

export type TicketStatusHistory = TicketStatusHistoryItem;

export interface CreateTicketInput {
  studentId: string;
  topic: string;
  description: string;
  requestedMinutes?: number;
  tags?: string[];
  scheduledTime?: Date | null;
}

export interface TicketModel {
  id: string;
  studentId: string;
  mentorId?: string | null;
  topic: string;
  description: string;
  requestedMinutes: number;
  status: string;
  scheduledTime?: Date | null;
  actualTimeSpentMinutes: number;
  tags: string[];
  guidanceMessage?: string | null;
  statusHistory: TicketStatusHistoryItem[];
  createdAt?: Date;
  updatedAt?: Date;
}
