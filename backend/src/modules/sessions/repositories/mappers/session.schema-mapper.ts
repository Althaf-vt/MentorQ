import { SessionDocument } from '../../schemas/session.schema.js';
import { SessionModel } from '../../types/session.type.js';
import { extractIdString, type PopulatedOrId } from '../../../../common/types/mongoose-populated.type.js';

export class SessionSchemaMapper {
  static toDomain(doc: SessionDocument): SessionModel {
    const ticketId = extractIdString(doc.ticket_id as PopulatedOrId);
    const mentorId = extractIdString(doc.mentor_id as PopulatedOrId);
    const studentId = extractIdString(doc.student_id as PopulatedOrId);

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
