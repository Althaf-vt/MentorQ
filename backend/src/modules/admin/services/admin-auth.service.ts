import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Admin, AdminDocument, AdminStatus } from '../schemas/admin.schema.js';
import { MailService } from '../../auth/services/mail.service.js';
import { 
  AdminLoginDto, 
  AdminForgotPasswordDto, 
  AdminVerifyOtpDto, 
  AdminResetPasswordDto 
} from '../dto/admin-auth.dto.js';

@Injectable()
export class AdminAuthService {
  constructor(
    @InjectModel(Admin.name) private readonly adminModel: Model<AdminDocument>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async login(credentials: AdminLoginDto) {
    const admin = await this.adminModel.findOne({ email: credentials.email });
    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (admin.status === AdminStatus.SUSPENDED) {
      throw new UnauthorizedException('Admin account is suspended');
    }

    const isPasswordValid = await bcrypt.compare(credentials.password, admin.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: admin._id, email: admin.email, role: admin.role };
    return {
      access_token: this.jwtService.sign(payload),
      admin: {
        id: admin._id,
        email: admin.email,
        role: admin.role,
        status: admin.status,
      },
    };
  }

  async forgotPassword(data: AdminForgotPasswordDto) {
    const admin = await this.adminModel.findOne({ email: data.email });
    if (!admin) {
      // Don't leak whether an email exists or not
      return { message: 'If an account exists with this email, an OTP has been sent.' };
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    admin.otp = otp;
    admin.otpExpiresAt = otpExpiresAt;
    await admin.save();

    await this.mailService.sendOtp(admin.email, otp);

    return { message: 'If an account exists with this email, an OTP has been sent.' };
  }

  async verifyOtp(data: AdminVerifyOtpDto) {
    const admin = await this.adminModel.findOne({ email: data.email });
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
      { sub: admin._id, intent: 'reset_password' },
      { expiresIn: '15m' }
    );

    // Clear OTP after successful verification
    admin.otp = undefined;
    admin.otpExpiresAt = undefined;
    await admin.save();

    return { 
      message: 'OTP verified successfully',
      resetToken 
    };
  }

  async resetPassword(data: AdminResetPasswordDto) {
    let payload;
    try {
      payload = this.jwtService.verify(data.token);
    } catch (e) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (payload.intent !== 'reset_password') {
      throw new BadRequestException('Invalid token intent');
    }

    const admin = await this.adminModel.findById(payload.sub);
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    const password_hash = await bcrypt.hash(data.newPassword, 10);
    admin.password_hash = password_hash;
    await admin.save();

    return { message: 'Password reset successfully' };
  }
}
