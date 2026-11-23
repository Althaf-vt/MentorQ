import { UserModel } from '../../users/types/user.type.js';
import { AuthTokenResponseDto } from '../types/auth.type.js';

export class AuthDtoMapper {
  static toTokenResponse(accessToken: string, user: UserModel): AuthTokenResponseDto {
    const id = user.id || user._id;
    const fullName = user.fullName || user.full_name || '';
    return {
      access_token: accessToken,
      user: {
        id,
        fullName,
        email: user.email,
        role: user.role,
      },
    };
  }
}
