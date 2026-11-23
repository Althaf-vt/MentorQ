import { Injectable, Inject, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { MailService } from '../../auth/services/mail.service.js';
import { ADMIN_REPOSITORY, type IAdminRepository } from '../repositories/admin.repository.interface.js';
import { AdminDtoMapper } from '../mappers/admin.dto-mapper.js';
import { AdminStatus, AdminTokenResponseDto } from '../types/admin.type.js';
import { 
  AdminLoginDto, 
  AdminForgotPasswordDto, 
  AdminVerifyOtpDto, 
  AdminResetPasswordDto 
} from '../dto/admin-auth.dto.js';

@Injectable()
export class AdminAuthService {
  constructor(
    @Inject(ADMIN_REPOSITORY) private readonly adminRepository: IAdminRepository,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async login(credentials: AdminLoginDto): Promise<AdminTokenResponseDto> {
    const admin = await this.adminRepository.findByEmail(credentials.email);
    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (admin.status === AdminStatus.SUSPENDED) {
      throw new UnauthorizedException('Admin account is suspended');
    }

    const isPasswordValid = await bcrypt.compare(credentials.password, admin.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: admin.id, email: admin.email, role: admin.role };
    return AdminDtoMapper.toTokenResponse(this.jwtService.sign(payload), admin);
  }

  async forgotPassword(data: AdminForgotPasswordDto) {
    const admin = await this.adminRepository.findByEmail(data.email);
    if (!admin) {
      // Don't leak whether an email exists or not
      return { message: 'If an account exists with this email, an OTP has been sent.' };
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    await this.adminRepository.setOtp(admin.id, otp, otpExpiresAt);
    await this.mailService.sendOtp(admin.email, otp);

    return { message: 'If an account exists with this email, an OTP has been sent.' };
  }

  async verifyOtp(data: AdminVerifyOtpDto) {
    const admin = await this.adminRepository.findByEmail(data.email);
    if (!admin) {
      throw new UnauthorizedException('Invalid OTP');
    }

    if (!admin.otp || admin.otp !== data.otp) {
      throw new UnauthorizedException('Invalid OTP');
    }

    if (!admin.otpExpiresAt || admin.otpExpiresAt < new Date()) {
      throw new UnauthorizedException('OTP has expired');
    }

    // Generate a temporary reset token (e.g., valid for 15 mins)
    const resetToken = this.jwtService.sign(
      { sub: admin.id, intent: 'reset_password' },
      { expiresIn: '15m' },
    );

    // Clear OTP after successful verification
    await this.adminRepository.clearOtp(admin.id);

    return { 
      message: 'OTP verified successfully',
      resetToken,
    };
  }

  async resetPassword(data: AdminResetPasswordDto) {
    let payload;
    try {
      payload = this.jwtService.verify(data.token);
    } catch {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (payload.intent !== 'reset_password') {
      throw new BadRequestException('Invalid token intent');
    }

    const admin = await this.adminRepository.findById(payload.sub);
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    const password_hash = await bcrypt.hash(data.newPassword, 10);
    await this.adminRepository.updatePassword(admin.id, password_hash);

    return { message: 'Password reset successfully' };
  }
}
