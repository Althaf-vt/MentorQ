import { Controller, Post, Body, Get, UseGuards, Req, Res, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../services/auth.service.js';
import * as express from 'express';
import { RegisterDto } from '../dto/register.dto.js';
import { LoginDto } from '../dto/login.dto.js';
import { SendOtpDto, VerifyOtpDto } from '../dto/otp.dto.js';
import {
  AuthTokenResponseDto,
  AuthMessageResponseDto,
  AuthOtpVerifyResponseDto,
  GoogleOAuthProfile,
} from '../types/auth.type.js';
import { AUTH_CONFIG } from '../constants/auth.constants.js';
import { USER_ROLES } from '../../users/constants/users.constants.js';

export interface GoogleAuthRequest extends express.Request {
  user: GoogleOAuthProfile;
}
import type { AuthenticatedRequest } from '../../../common/types/authenticated-request.type.js';

export class GoogleAuthGuardWithState extends AuthGuard('google') {
  getAuthenticateOptions(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    return {
      state: req.query.state,
    };
  }
}

@Controller('api/v1/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  async register(@Body() userData: RegisterDto): Promise<AuthMessageResponseDto> {
    return this.authService.register(userData);
  }

  @Post('login')
  async login(@Body() credentials: LoginDto): Promise<AuthTokenResponseDto> {
    return this.authService.login(credentials);
  }

  @Post('otp/send')
  async sendOtp(@Body() sendOtpDto: SendOtpDto): Promise<AuthMessageResponseDto> {
    return this.authService.sendOtp(sendOtpDto.email);
  }

  @Post('otp/verify')
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto): Promise<AuthOtpVerifyResponseDto> {
    return this.authService.verifyOtp(verifyOtpDto.email, verifyOtpDto.otp, verifyOtpDto.expectedRole);
  }

  @Post('refresh')
  @UseGuards(AuthGuard('jwt'))
  async refreshToken(@Req() req: AuthenticatedRequest): Promise<AuthTokenResponseDto> {
    return this.authService.refreshToken(req.user);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuardWithState)
  async googleAuth(@Req() _req: express.Request): Promise<void> {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(
    @Req() req: GoogleAuthRequest,
    @Res() res: express.Response,
  ): Promise<void> {
    const expectedRole = req.query.state as string;
    const authResult = await this.authService.validateGoogleUser(req.user, expectedRole);
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || AUTH_CONFIG.DEFAULT_FRONTEND_URL;
    const loginPath = expectedRole === USER_ROLES.MENTOR ? AUTH_CONFIG.LOGIN_ROUTES.MENTOR : AUTH_CONFIG.LOGIN_ROUTES.STUDENT;
    const redirectUrl = `${frontendUrl}${loginPath}?token=${authResult.access_token}&user=${encodeURIComponent(
      JSON.stringify(authResult.user),
    )}`;
    return res.redirect(redirectUrl);
  }
}
