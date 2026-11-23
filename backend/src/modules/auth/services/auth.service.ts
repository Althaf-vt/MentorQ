import { Injectable, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AppException, ErrorCode } from '../../../common/exceptions/app.exception.js';
import { UsersService } from '../../users/services/users.service.js';
import { UserModel } from '../../users/types/user.type.js';
import { OTP_REPOSITORY, type IOtpRepository } from '../repositories/otp.repository.interface.js';
import { MailService } from './mail.service.js';
import { AuthDtoMapper } from '../mappers/auth.dto-mapper.js';
import { AuthTokenResponseDto, JwtUserPayload } from '../types/auth.type.js';
import { RegisterDto } from '../dto/register.dto.js';
import { LoginDto } from '../dto/login.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    @Inject(OTP_REPOSITORY) private readonly otpRepository: IOtpRepository,
  ) {}

  async register(userData: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(userData.email);
    if (existingUser) {
      throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS, 'Email already registered');
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

  async login(credentials: LoginDto): Promise<AuthTokenResponseDto> {
    const user = await this.usersService.findByEmail(credentials.email);
    if (!user) {
      throw new AppException(ErrorCode.INVALID_CREDENTIALS, 'Invalid credentials');
    }

    if (credentials.expectedRole && credentials.expectedRole !== user.role) {
      if (credentials.expectedRole === 'MENTOR') {
        throw new AppException(ErrorCode.FORBIDDEN, 'Mentor profile not accessed');
      } else if (credentials.expectedRole === 'STUDENT') {
        throw new AppException(ErrorCode.USER_NOT_FOUND, 'User not found');
      } else {
        throw new AppException(ErrorCode.UNAUTHORIZED, 'Invalid role specified');
      }
    }

    const isPasswordValid = await bcrypt.compare(credentials.password, user.password_hash);
    if (!isPasswordValid) {
      throw new AppException(ErrorCode.INVALID_CREDENTIALS, 'Invalid credentials');
    }

    if (!user.is_verified) {
      await this.sendOtp(user.email);
      throw new AppException(ErrorCode.EMAIL_NOT_VERIFIED, 'Please verify your email before logging in. A new verification code has been sent.');
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
    if (!otp || (otp.expiresAt || otp.expires_at) < new Date()) {
      throw new AppException(ErrorCode.INVALID_OR_EXPIRED_OTP, 'Invalid or expired OTP');
    }

    await this.otpRepository.markAsVerified(otp.id || otp._id);

    const user = await this.usersService.findByEmail(email);
    let tokenData = {};
    if (user) {
      if (expectedRole && user.role !== expectedRole) {
        if (expectedRole === 'MENTOR') {
          throw new AppException(ErrorCode.FORBIDDEN, 'Mentor profile not accessed');
        } else if (expectedRole === 'STUDENT') {
          throw new AppException(ErrorCode.USER_NOT_FOUND, 'User not found');
        } else {
          throw new AppException(ErrorCode.UNAUTHORIZED, 'Invalid role specified');
        }
      }

      const updatedUser = await this.usersService.verifyUser(user.id || user._id);
      tokenData = this.generateToken(updatedUser);
    }

    return {
      message: 'OTP verified successfully',
      ...tokenData,
    };
  }

  private generateToken(user: UserModel): AuthTokenResponseDto {
    const id = user.id || user._id;
    const payload = { sub: id, email: user.email, role: user.role };
    return AuthDtoMapper.toTokenResponse(this.jwtService.sign(payload), user);
  }

  async validateGoogleUser(profile: any, expectedRole?: string) {
    let user = await this.usersService.findByEmail(profile.emails[0].value);

    if (user && expectedRole && user.role !== expectedRole) {
      if (expectedRole === 'MENTOR') {
        throw new AppException(ErrorCode.FORBIDDEN, 'Mentor profile not accessed');
      } else if (expectedRole === 'STUDENT') {
        throw new AppException(ErrorCode.USER_NOT_FOUND, 'User not found');
      } else {
        throw new AppException(ErrorCode.UNAUTHORIZED, 'Invalid role specified');
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
      user = await this.usersService.verifyUser(user.id || user._id);
    }
    return this.generateToken(user);
  }

  async refreshToken(jwtUser: JwtUserPayload) {
    const user = await this.usersService.findById(jwtUser.id);
    if (!user) {
      throw new AppException(ErrorCode.USER_NOT_FOUND, 'User no longer exists');
    }
    return this.generateToken(user);
  }

  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      return this.usersService.findById(payload.sub);
    } catch {
      return null;
    }
  }
}
