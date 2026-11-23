import { Injectable, Inject, UnauthorizedException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../../users/services/users.service.js';
import { OTP_REPOSITORY, type IOtpRepository } from '../repositories/otp.repository.interface.js';
import { MailService } from './mail.service.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    @Inject(OTP_REPOSITORY) private readonly otpRepository: IOtpRepository,
  ) {}

  async register(userData: any) {
    const existingUser = await this.usersService.findByEmail(userData.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = await this.usersService.createUser({
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

    if (credentials.expectedRole && credentials.expectedRole !== user.role) {
      if (credentials.expectedRole === 'MENTOR') {
        throw new ForbiddenException('Mentor profile not accessed');
      } else if (credentials.expectedRole === 'STUDENT') {
        throw new NotFoundException('User not found');
      } else {
        throw new UnauthorizedException('Invalid role specified');
      }
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

    await this.otpRepository.upsertOtp(email, otpCode, expiresAt);

    await this.mailService.sendOtp(email, otpCode);
    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(email: string, code: string, expectedRole?: string) {
    const otp = await this.otpRepository.findValidOtp(email, code);
    if (!otp || otp.expires_at < new Date()) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    await this.otpRepository.markAsVerified(otp._id.toString());

    const user = await this.usersService.findByEmail(email);
    let tokenData = {};
    if (user) {
      if (expectedRole && user.role !== expectedRole) {
        if (expectedRole === 'MENTOR') {
          throw new ForbiddenException('Mentor profile not accessed');
        } else if (expectedRole === 'STUDENT') {
          throw new NotFoundException('User not found');
        } else {
          throw new UnauthorizedException('Invalid role specified');
        }
      }

      const updatedUser = await this.usersService.verifyUser(user._id.toString());
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

  async validateGoogleUser(profile: any, expectedRole?: string) {
    let user = await this.usersService.findByEmail(profile.emails[0].value);

    if (user && expectedRole && user.role !== expectedRole) {
      if (expectedRole === 'MENTOR') {
        throw new ForbiddenException('Mentor profile not accessed');
      } else if (expectedRole === 'STUDENT') {
        throw new NotFoundException('User not found');
      } else {
        throw new UnauthorizedException('Invalid role specified');
      }
    }

    if (!user) {
      user = await this.usersService.createUser({
        full_name: profile.displayName,
        email: profile.emails[0].value,
        password_hash: 'OAUTH_USER', // Placeholder
        avatar_url: profile.photos[0]?.value,
        role: expectedRole || 'STUDENT',
        is_verified: true,
      });
    } else if (!user.is_verified) {
      user = await this.usersService.verifyUser(user._id.toString());
    }
    return this.generateToken(user);
  }

  async refreshToken(jwtUser: { id: string; email: string; role: string }) {
    const user = await this.usersService.findById(jwtUser.id);
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
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
