import { SessionDocument } from '../../schemas/session.schema.js';
import { SessionModel } from '../../types/session.type.js';

export class SessionSchemaMapper {
  static toDomain(doc: SessionDocument): SessionModel {
    const rawTicketId = doc.ticket_id;
    const ticketId = (rawTicketId as any)?._id?.toString?.() || rawTicketId?.toString?.() || String(rawTicketId);

    const rawMentorId = doc.mentor_id;
    const mentorId = (rawMentorId as any)?._id?.toString?.() || rawMentorId?.toString?.() || String(rawMentorId);

    const rawStudentId = doc.student_id;
    const studentId = (rawStudentId as any)?._id?.toString?.() || rawStudentId?.toString?.() || String(rawStudentId);

    return {
      id: doc._id.toString(),
      ticketId,
      mentorId,
      studentId,
      startedAt: doc.started_at,
      allocatedMinutes: doc.allocated_minutes,
      extendedMinutes: doc.extended_minutes ?? 0,
      endedAt: doc.ended_at || null,
      actualDurationMinutes: doc.actual_duration_minutes ?? 0,
      sessionStatus: doc.session_status,
      resolutionNotes: doc.resolution_notes || null,
      lastEmptyAt: doc.last_empty_at || null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  static toDomainList(docs: SessionDocument[]): SessionModel[] {
    return docs.map((doc) => this.toDomain(doc));
  }
}
