import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtTokenPayload } from '../types/auth.type.js';
import { AuthenticatedUser } from '../../../common/types/authenticated-request.type.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'default_jwt_secret',
    });
  }

  async validate(payload: JwtTokenPayload): Promise<AuthenticatedUser> {
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
