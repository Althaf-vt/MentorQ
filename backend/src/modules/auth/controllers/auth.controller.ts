import { Controller, Post, Body, Get, UseGuards, Req, Res, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../services/auth.service.js';
import * as express from 'express';
import { RegisterDto } from '../dto/register.dto.js';
import { LoginDto } from '../dto/login.dto.js';
import { SendOtpDto, VerifyOtpDto } from '../dto/otp.dto.js';
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
  async register(@Body() userData: RegisterDto) {
    return this.authService.register(userData);
  }

  @Post('login')
  async login(@Body() credentials: LoginDto) {
    return this.authService.login(credentials);
  }

  @Post('otp/send')
  async sendOtp(@Body() sendOtpDto: SendOtpDto) {
    return this.authService.sendOtp(sendOtpDto.email);
  }

  @Post('otp/verify')
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto.email, verifyOtpDto.otp, verifyOtpDto.expectedRole);
  }

  @Post('refresh')
  @UseGuards(AuthGuard('jwt'))
  async refreshToken(@Req() req: AuthenticatedRequest) {
    return this.authService.refreshToken(req.user);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuardWithState)
  async googleAuth(@Req() _req: any) {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: any, @Res() res: express.Response) {
    const expectedRole = req.query.state as string;
    const authResult = await this.authService.validateGoogleUser(req.user, expectedRole);
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5180';
    const loginPath = expectedRole === 'MENTOR' ? '/mentor/login' : '/login';
    const redirectUrl = `${frontendUrl}${loginPath}?token=${authResult.access_token}&user=${encodeURIComponent(
      JSON.stringify(authResult.user),
    )}`;
    return res.redirect(redirectUrl);
  }
}
