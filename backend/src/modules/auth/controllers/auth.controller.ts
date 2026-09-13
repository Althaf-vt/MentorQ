import { Controller, Post, Body, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../services/auth.service.js';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() userData: any) {
    return this.authService.register(userData);
  }

  @Post('login')
  async login(@Body() credentials: any) {
    return this.authService.login(credentials);
  }

  @Post('otp/send')
  async sendOtp(@Body('email') email: string) {
    return this.authService.sendOtp(email);
  }

  @Post('otp/verify')
  async verifyOtp(@Body('email') email: string, @Body('otp') otp: string) {
    return this.authService.verifyOtp(email, otp);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req: any) {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: any) {
    return this.authService.validateGoogleUser(req.user);
  }
}
