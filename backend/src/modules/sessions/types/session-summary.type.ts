export interface SessionSummary {
  id: string;
  ticketId: string;
  mentorId: string;
  studentId: string;
  sessionStatus: string;
  startedAt: Date;
  allocatedMinutes: number;
}
