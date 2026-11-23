import { TicketStatusHistoryItem } from '../types/ticket.type.js';

export interface TicketResponseDto {
  id: string;
  studentId: string;
  mentorId: string | null;
  topic: string;
  description: string;
  requestedMinutes: number;
  status: string;
  scheduledTime: Date | null;
  actualTimeSpentMinutes: number;
  tags: string[];
  guidanceMessage: string | null;
  statusHistory: TicketStatusHistoryItem[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TicketQueuePositionResponseDto {
  position: number;
}
