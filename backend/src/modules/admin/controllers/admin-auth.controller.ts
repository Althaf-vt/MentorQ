import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AdminAuthService } from '../services/admin-auth.service.js';
import { 
  AdminLoginDto, 
  AdminForgotPasswordDto, 
  AdminVerifyOtpDto, 
  AdminResetPasswordDto 
} from '../dto/admin-auth.dto.js';

@Controller('api/v1/admin/auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: AdminLoginDto) {
    return this.adminAuthService.login(loginDto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: AdminForgotPasswordDto) {
    return this.adminAuthService.forgotPassword(forgotPasswordDto);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() verifyOtpDto: AdminVerifyOtpDto) {
    return this.adminAuthService.verifyOtp(verifyOtpDto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: AdminResetPasswordDto) {
    return this.adminAuthService.resetPassword(resetPasswordDto);
  }
}
