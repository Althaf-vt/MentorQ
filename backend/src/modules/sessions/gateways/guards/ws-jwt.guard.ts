import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthService } from '../../../auth/services/auth.service.js';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client = context.switchToWs().getClient();
      const authToken = client.handshake?.auth?.token || client.handshake?.headers?.authorization;
      
      if (!authToken) return false;

      const token = authToken.split(' ')[1] || authToken;
      const user = await this.authService.validateToken(token);
      
      if (!user) return false;

      client.user = user;
      return true;
    } catch (err) {
      return false;
    }
  }
}
