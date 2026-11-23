export const TICKET_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type TicketStatusType = (typeof TICKET_STATUS)[keyof typeof TICKET_STATUS];

export const TICKET_FEEDBACK = {
  CLAIMED_BY_MENTOR: 'Ticket claimed by mentor',
  RESOLVED_WITH_GUIDANCE: 'Resolved with guidance',
} as const;

export const TICKET_ERROR_MESSAGES = {
  NOT_FOUND: 'Ticket not found',
  NOT_PENDING: 'Ticket is not in PENDING status',
  ALREADY_CLAIMED: 'Ticket is already claimed',
  NOT_FOUND_DURING_CLAIM: 'Ticket not found during claim',
  MUST_BE_APPROVED_OR_ACTIVE: 'Ticket must be APPROVED or ACTIVE to resolve',
  NOT_MENTOR_FOR_TICKET: 'You are not the mentor for this ticket',
  NOT_FOUND_DURING_RESOLUTION: 'Ticket not found during resolution',
  NOT_FOUND_DURING_UPDATE: 'Ticket not found during update',
} as const;
