import { AdminDocument } from '../../schemas/admin.schema.js';
import { AdminModel, AdminRole, AdminStatus } from '../../types/admin.type.js';

export class AdminSchemaMapper {
  static toDomain(doc: AdminDocument | null | undefined): AdminModel | null {
    if (!doc) return null;

    return {
      id: doc._id.toString(),
      email: doc.email,
      passwordHash: doc.password_hash,
      role: doc.role as AdminRole,
      status: doc.status as AdminStatus,
      otp: doc.otp,
      otpExpiresAt: doc.otpExpiresAt,
      createdAt: (doc as AdminDocument & { created_at?: Date }).created_at,
      updatedAt: (doc as AdminDocument & { updated_at?: Date }).updated_at,
    };
  }

  static toDomainList(docs: AdminDocument[]): AdminModel[] {
    return docs
      .map((doc) => this.toDomain(doc))
      .filter((model): model is AdminModel => model !== null);
  }
}
