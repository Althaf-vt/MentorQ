import { Injectable, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AppException, ErrorCode } from '../../../common/exceptions/app.exception.js';
import { MailService } from '../../auth/services/mail.service.js';
import { ADMIN_REPOSITORY, type IAdminRepository } from '../repositories/admin.repository.interface.js';
import { AdminDtoMapper } from '../mappers/admin.dto-mapper.js';
import { AdminStatus, AdminTokenResponseDto, AdminMessageResponseDto, AdminOtpVerifyResponseDto } from '../types/admin.type.js';
import { 
  AdminLoginDto, 
  AdminForgotPasswordDto, 
  AdminVerifyOtpDto, 
  AdminResetPasswordDto 
} from '../dto/admin-auth.dto.js';
import {
  ADMIN_CONFIG,
  ADMIN_MESSAGES,
  ADMIN_ERROR_MESSAGES,
} from '../constants/admin.constants.js';

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
      throw new AppException(ErrorCode.INVALID_CREDENTIALS, ADMIN_ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    if (admin.status === AdminStatus.SUSPENDED) {
      throw new AppException(ErrorCode.ACCOUNT_SUSPENDED, ADMIN_ERROR_MESSAGES.ACCOUNT_SUSPENDED);
    }

    const isPasswordValid = await bcrypt.compare(credentials.password, admin.passwordHash);
    if (!isPasswordValid) {
      throw new AppException(ErrorCode.INVALID_CREDENTIALS, ADMIN_ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    const payload = { sub: admin.id, email: admin.email, role: admin.role };
    return AdminDtoMapper.toTokenResponse(this.jwtService.sign(payload), admin);
  }

  async forgotPassword(data: AdminForgotPasswordDto): Promise<AdminMessageResponseDto> {
    const admin = await this.adminRepository.findByEmail(data.email);
    if (!admin) {
      // Don't leak whether an email exists or not
      return { message: ADMIN_MESSAGES.OTP_SENT_MASKED };
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + ADMIN_CONFIG.OTP_EXPIRY_MS);

    await this.adminRepository.setOtp(admin.id, otp, otpExpiresAt);
    await this.mailService.sendOtp(admin.email, otp);

    return { message: ADMIN_MESSAGES.OTP_SENT_MASKED };
  }

  async verifyOtp(data: AdminVerifyOtpDto): Promise<AdminOtpVerifyResponseDto> {
    const admin = await this.adminRepository.findByEmail(data.email);
    if (!admin) {
      throw new AppException(ErrorCode.INVALID_OR_EXPIRED_OTP, ADMIN_ERROR_MESSAGES.INVALID_OTP);
    }

    if (!admin.otp || admin.otp !== data.otp) {
      throw new AppException(ErrorCode.INVALID_OR_EXPIRED_OTP, ADMIN_ERROR_MESSAGES.INVALID_OTP);
    }

    if (!admin.otpExpiresAt || admin.otpExpiresAt < new Date()) {
      throw new AppException(ErrorCode.INVALID_OR_EXPIRED_OTP, ADMIN_ERROR_MESSAGES.OTP_EXPIRED);
    }

    // Generate a temporary reset token (e.g., valid for 15 mins)
    const resetToken = this.jwtService.sign(
      { sub: admin.id, intent: ADMIN_CONFIG.RESET_TOKEN_INTENT },
      { expiresIn: ADMIN_CONFIG.RESET_TOKEN_EXPIRY },
    );

    // Clear OTP after successful verification
    await this.adminRepository.clearOtp(admin.id);

    return { 
      message: ADMIN_MESSAGES.OTP_VERIFIED,
      resetToken,
    };
  }

  async resetPassword(data: AdminResetPasswordDto): Promise<AdminMessageResponseDto> {
    let payload: { intent?: string; sub: string };
    try {
      payload = this.jwtService.verify(data.token);
    } catch {
      throw new AppException(ErrorCode.BAD_REQUEST, ADMIN_ERROR_MESSAGES.INVALID_OR_EXPIRED_RESET_TOKEN);
    }

    if (payload.intent !== ADMIN_CONFIG.RESET_TOKEN_INTENT) {
      throw new AppException(ErrorCode.BAD_REQUEST, ADMIN_ERROR_MESSAGES.INVALID_TOKEN_INTENT);
    }

    const admin = await this.adminRepository.findById(payload.sub);
    if (!admin) {
      throw new AppException(ErrorCode.USER_NOT_FOUND, ADMIN_ERROR_MESSAGES.ADMIN_NOT_FOUND);
    }

    const password_hash = await bcrypt.hash(data.newPassword, ADMIN_CONFIG.BCRYPT_SALT_ROUNDS);
    await this.adminRepository.updatePassword(admin.id, password_hash);

    return { message: ADMIN_MESSAGES.PASSWORD_RESET_SUCCESS };
  }
}
