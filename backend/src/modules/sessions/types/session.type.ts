export interface SessionModel {
  id: string;
  ticketId: string;
  mentorId: string;
  studentId: string;
  startedAt: Date;
  allocatedMinutes: number;
  extendedMinutes: number;
  endedAt?: Date | null;
  actualDurationMinutes: number;
  sessionStatus: string;
  resolutionNotes?: string | null;
  lastEmptyAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}
