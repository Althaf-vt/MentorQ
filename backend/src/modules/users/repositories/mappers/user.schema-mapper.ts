import { UserDocument } from '../../schemas/user.schema.js';
import { UserModel } from '../../types/user.type.js';

export class UserSchemaMapper {
  static toDomain(doc: UserDocument): UserModel {
    const favoriteMentors = (doc.favorite_mentors || []).map((m: any) =>
      m?._id?.toString?.() || m?.toString?.() || String(m),
    );

    return {
      id: doc._id.toString(),
      _id: doc._id.toString(),
      fullName: doc.full_name,
      full_name: doc.full_name,
      email: doc.email,
      passwordHash: doc.password_hash,
      password_hash: doc.password_hash,
      role: doc.role,
      status: doc.status,
      isVerified: doc.is_verified,
      is_verified: doc.is_verified,
      avatarUrl: doc.avatar_url,
      socialLinks: doc.social_links,
      isOnline: doc.is_online ?? false,
      favoriteMentors,
      createdAt: (doc as any).created_at,
      updatedAt: (doc as any).updated_at,
    };
  }

  static toDomainList(docs: UserDocument[]): UserModel[] {
    return docs.map((doc) => this.toDomain(doc));
  }
}
