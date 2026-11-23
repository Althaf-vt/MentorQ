import { MentorProfileDocument } from '../../schemas/mentor-profile.schema.js';
import { MentorProfileModel } from '../../types/mentor-profile.type.js';

export class MentorProfileSchemaMapper {
  static toDomain(doc: MentorProfileDocument): MentorProfileModel {
    const rawUserId = doc.user_id;
    const userId = rawUserId?._id?.toString?.() || rawUserId?.toString?.() || String(rawUserId);

    return {
      id: doc._id.toString(),
      userId,
      expertiseTags: doc.expertise_tags || [],
      dailyAvailableMinutes: doc.daily_available_minutes ?? 90,
      remainingMinutesToday: doc.remaining_minutes_today ?? 90,
      isOnline: doc.is_online ?? true,
      ratingAvg: doc.rating_avg ?? 0,
      operatingHours: doc.operating_hours || {
        start: '09:00 AM',
        end: '06:00 PM',
        timezone: 'Asia/Kolkata',
      },
      createdAt: (doc as any).created_at,
      updatedAt: (doc as any).updated_at,
    };
  }

  static toDomainList(docs: MentorProfileDocument[]): MentorProfileModel[] {
    return docs.map((doc) => this.toDomain(doc));
  }
}
