export interface SessionResponseDto {
  id: string;
  ticketId: string;
  mentorId: string;
  studentId: string;
  startedAt: Date;
  allocatedMinutes: number;
  extendedMinutes: number;
  endedAt: Date | null;
  actualDurationMinutes: number;
  sessionStatus: string;
  resolutionNotes: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}
