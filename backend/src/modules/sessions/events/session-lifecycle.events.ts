export interface FocusModeStartedPayload {
  sessionId: string;
  ticketId: string;
  studentId: string;
  mentorId: string;
  startedAt: Date;
  allocatedMinutes: number;
}

export class SessionFocusStartedEvent {
  constructor(public readonly payload: FocusModeStartedPayload) {}
}

export class SessionEndedEvent {
  constructor(
    public readonly sessionId: string,
    public readonly resolutionNotes?: string,
    public readonly userId?: string,
    public readonly endedByRole?: 'MENTOR' | 'STUDENT',
  ) {}
}

export const SESSION_EVENTS = {
  FOCUS_STARTED: 'session.focus_started',
  ENDED: 'session.ended',
} as const;
