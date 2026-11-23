import { ReviewDocument } from '../../schemas/review.schema.js';
import { ReviewModel } from '../../types/review.type.js';

export class ReviewSchemaMapper {
  static toDomain(doc: ReviewDocument): ReviewModel {
    return {
      id: doc._id.toString(),
      sessionId: doc.session_id.toString(),
      studentId: doc.student_id.toString(),
      mentorId: doc.mentor_id.toString(),
      rating: doc.rating,
      feedbackText: doc.feedback_text,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  static toDomainList(docs: ReviewDocument[]): ReviewModel[] {
    return docs.map((doc) => this.toDomain(doc));
  }
}
