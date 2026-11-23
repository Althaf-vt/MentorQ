import { TicketDocument } from '../../schemas/ticket.schema.js';
import { TicketModel } from '../../types/ticket.type.js';

export class TicketSchemaMapper {
  static toDomain(doc: TicketDocument): TicketModel {
    const rawStudentId = doc.student_id;
    const studentId = (rawStudentId as any)?._id?.toString?.() || rawStudentId?.toString?.() || String(rawStudentId);

    const rawMentorId = doc.mentor_id;
    const mentorId = rawMentorId
      ? (rawMentorId as any)?._id?.toString?.() || rawMentorId?.toString?.() || String(rawMentorId)
      : null;

    return {
      id: doc._id.toString(),
      studentId,
      mentorId,
      topic: doc.topic,
      description: doc.description,
      requestedMinutes: doc.requested_minutes ?? 15,
      status: doc.status,
      scheduledTime: doc.scheduled_time || null,
      actualTimeSpentMinutes: doc.actual_time_spent_minutes ?? 0,
      tags: doc.tags || [],
      guidanceMessage: doc.guidance_message || null,
      statusHistory: (doc.status_history || []).map((h: any) => ({
        status: h.status,
        timestamp: h.timestamp,
        feedback_note: h.feedback_note,
      })),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  static toDomainList(docs: TicketDocument[]): TicketModel[] {
    return docs.map((doc) => this.toDomain(doc));
  }
}
