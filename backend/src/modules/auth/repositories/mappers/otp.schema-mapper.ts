import { OtpDocument } from '../../schemas/otp.schema.js';
import { OtpModel } from '../../types/otp.type.js';

export class OtpSchemaMapper {
  static toDomain(doc: OtpDocument | null | undefined): OtpModel | null {
    if (!doc) return null;
    const raw = 'toObject' in doc && typeof doc.toObject === 'function' ? doc.toObject<OtpDocument>() : doc;
    const id = raw._id ? raw._id.toString() : '';

    return {
      _id: id,
      id,
      email: raw.email,
      otpCode: raw.otp_code,
      otp_code: raw.otp_code,
      expiresAt: raw.expires_at,
      expires_at: raw.expires_at,
      isVerified: Boolean(raw.is_verified),
      is_verified: Boolean(raw.is_verified),
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    };
  }

  static toDomainList(docs: OtpDocument[]): OtpModel[] {
    return docs
      .map((doc) => this.toDomain(doc))
      .filter((model): model is OtpModel => model !== null);
  }
}
