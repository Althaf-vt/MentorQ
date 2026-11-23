export interface TicketStatusHistory {
  status: string;
  timestamp: Date;
  feedback_note?: string;
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
  statusHistory: TicketStatusHistory[];
  createdAt?: Date;
  updatedAt?: Date;
}
