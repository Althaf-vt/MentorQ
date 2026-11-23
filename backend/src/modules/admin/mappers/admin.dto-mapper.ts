import { AdminModel, AdminTokenResponseDto } from '../types/admin.type.js';

export class AdminDtoMapper {
  static toTokenResponse(accessToken: string, admin: AdminModel): AdminTokenResponseDto {
    return {
      access_token: accessToken,
      admin: {
        id: admin.id,
        email: admin.email,
        role: String(admin.role),
        status: String(admin.status),
      },
    };
  }
}
