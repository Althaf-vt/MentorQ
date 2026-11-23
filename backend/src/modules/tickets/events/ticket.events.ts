export class TicketRequestedEvent {
  constructor(public readonly ticketId: string) {}
}

export class TicketClaimedEvent {
  constructor(
    public readonly ticketId: string,
    public readonly studentId: string,
  ) {}
}

export class TicketResolvedEvent {
  constructor(
    public readonly ticketId: string,
    public readonly studentId: string,
    public readonly mentorId: string,
  ) {}
}

export const TICKET_EVENTS = {
  REQUESTED: 'ticket.requested',
  CLAIMED: 'ticket.claimed',
  RESOLVED: 'ticket.resolved',
} as const;
