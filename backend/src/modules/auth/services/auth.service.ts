import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../../users/services/users.service.js';
import { UsersRepository } from '../../users/repositories/users.repository.js';
import { Otp, OtpDocument } from '../schemas/otp.schema.js';
import { MailService } from './mail.service.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    @InjectModel(Otp.name) private readonly otpModel: Model<OtpDocument>,
  ) {}

  async register(userData: any) {
    const existingUser = await this.usersService.findByEmail(userData.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = await this.usersRepository.create({
      full_name: userData.fullName,
      email: userData.email,
      password_hash: hashedPassword,
      role: userData.role || 'STUDENT',
      is_verified: false,
    });

    await this.sendOtp(user.email);

    return {
      message: 'Registration successful. OTP sent to email.',
      email: user.email,
    };
  }

  async login(credentials: any) {
    const user = await this.usersService.findByEmail(credentials.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(credentials.password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.is_verified) {
      await this.sendOtp(user.email);
      throw new UnauthorizedException('Please verify your email before logging in. A new verification code has been sent.');
    }

    return this.generateToken(user);
  }

  async sendOtp(email: string) {
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await this.otpModel.findOneAndUpdate(
      { email },
      { otp_code: otpCode, expires_at: expiresAt, is_verified: false },
      { upsert: true, returnDocument: 'after' },
    );

    await this.mailService.sendOtp(email, otpCode);
    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(email: string, code: string) {
    const otp = await this.otpModel.findOne({ email, otp_code: code });
    if (!otp || otp.expires_at < new Date()) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    otp.is_verified = true;
    await otp.save();

    const user = await this.usersService.findByEmail(email);
    let tokenData = {};
    if (user) {
      await this.usersRepository.update(user._id.toString(), { is_verified: true });
      // Fetch fresh user
      const updatedUser = await this.usersService.findById(user._id.toString());
      tokenData = this.generateToken(updatedUser);
    }

    return {
      message: 'OTP verified successfully',
      ...tokenData,
    };
  }

  private generateToken(user: any) {
    const payload = { sub: user._id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async validateGoogleUser(profile: any) {
    let user = await this.usersService.findByEmail(profile.emails[0].value);
    if (!user) {
      user = await this.usersRepository.create({
        full_name: profile.displayName,
        email: profile.emails[0].value,
        password_hash: 'OAUTH_USER', // Placeholder
        avatar_url: profile.photos[0]?.value,
        role: 'STUDENT',
        is_verified: true,
      });
    } else if (!user.is_verified) {
      user = await this.usersRepository.update(user._id.toString(), { is_verified: true });
    }
    return this.generateToken(user);
  }

  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      return this.usersService.findById(payload.sub);
    } catch (err) {
      return null;
    }
  }
}
