import { Injectable, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AppException, ErrorCode } from '../../../common/exceptions/app.exception.js';
import { UsersService } from '../../users/services/users.service.js';
import { UserModel } from '../../users/types/user.type.js';
import { OTP_REPOSITORY, type IOtpRepository } from '../repositories/otp.repository.interface.js';
import { MailService } from './mail.service.js';
import { AuthDtoMapper } from '../mappers/auth.dto-mapper.js';
import { RoleVerificationPolicy } from '../policies/role-verification.policy.js';
import {
  AuthTokenResponseDto,
  JwtUserPayload,
  AuthMessageResponseDto,
  AuthOtpVerifyResponseDto,
  GoogleOAuthProfile,
} from '../types/auth.type.js';
import { RegisterDto } from '../dto/register.dto.js';
import { LoginDto } from '../dto/login.dto.js';
import { USER_ROLES } from '../../users/constants/users.constants.js';
import {
  AUTH_CONFIG,
  AUTH_MESSAGES,
  AUTH_ERROR_MESSAGES,
} from '../constants/auth.constants.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    @Inject(OTP_REPOSITORY) private readonly otpRepository: IOtpRepository,
  ) {}

  async register(userData: RegisterDto): Promise<AuthMessageResponseDto> {
    const existingUser = await this.usersService.findByEmail(userData.email);
    if (existingUser) {
      throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS, AUTH_ERROR_MESSAGES.EMAIL_ALREADY_EXISTS);
    }

    const hashedPassword = await bcrypt.hash(userData.password, AUTH_CONFIG.BCRYPT_SALT_ROUNDS);
    const user = await this.usersService.createUser({
      full_name: userData.fullName,
      email: userData.email,
      password_hash: hashedPassword,
      role: userData.role || USER_ROLES.STUDENT,
      is_verified: false,
    });

    await this.sendOtp(user.email);

    return {
      message: AUTH_MESSAGES.REGISTRATION_SUCCESS,
      email: user.email,
    };
  }

  async login(credentials: LoginDto): Promise<AuthTokenResponseDto> {
    const user = await this.usersService.findByEmail(credentials.email);
    if (!user) {
      throw new AppException(ErrorCode.INVALID_CREDENTIALS, AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    RoleVerificationPolicy.assertRoleMatches(user.role, credentials.expectedRole);

    const isPasswordValid = await bcrypt.compare(credentials.password, user.password_hash);
    if (!isPasswordValid) {
      throw new AppException(ErrorCode.INVALID_CREDENTIALS, AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    if (!user.is_verified) {
      await this.sendOtp(user.email);
      throw new AppException(ErrorCode.EMAIL_NOT_VERIFIED, AUTH_ERROR_MESSAGES.EMAIL_NOT_VERIFIED);
    }

    return this.generateToken(user);
  }

  async sendOtp(email: string): Promise<AuthMessageResponseDto> {
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + AUTH_CONFIG.OTP_EXPIRY_MS);

    await this.otpRepository.upsertOtp(email, otpCode, expiresAt);

    await this.mailService.sendOtp(email, otpCode);
    return { message: AUTH_MESSAGES.OTP_SENT };
  }

  async verifyOtp(
    email: string,
    code: string,
    expectedRole?: string,
  ): Promise<AuthOtpVerifyResponseDto> {
    const otp = await this.otpRepository.findValidOtp(email, code);
    if (!otp || (otp.expiresAt || otp.expires_at) < new Date()) {
      throw new AppException(ErrorCode.INVALID_OR_EXPIRED_OTP, AUTH_ERROR_MESSAGES.INVALID_OR_EXPIRED_OTP);
    }

    await this.otpRepository.markAsVerified(otp.id || otp._id);

    const user = await this.usersService.findByEmail(email);
    let tokenData = {};
    if (user) {
      RoleVerificationPolicy.assertRoleMatches(user.role, expectedRole);

      const updatedUser = await this.usersService.verifyUser(user.id || user._id);
      tokenData = this.generateToken(updatedUser);
    }

    return {
      message: AUTH_MESSAGES.OTP_VERIFIED,
      ...tokenData,
    };
  }

  private generateToken(user: UserModel): AuthTokenResponseDto {
    const id = user.id || user._id;
    const payload = { sub: id, email: user.email, role: user.role };
    return AuthDtoMapper.toTokenResponse(this.jwtService.sign(payload), user);
  }

  async validateGoogleUser(
    profile: GoogleOAuthProfile,
    expectedRole?: string,
  ): Promise<AuthTokenResponseDto> {
    let user = await this.usersService.findByEmail(profile.emails[0].value);

    if (user) {
      RoleVerificationPolicy.assertRoleMatches(user.role, expectedRole);
    }

    if (!user) {
      user = await this.usersService.createUser({
        full_name: profile.displayName,
        email: profile.emails[0].value,
        password_hash: AUTH_CONFIG.OAUTH_PASSWORD_PLACEHOLDER,
        avatar_url: profile.photos?.[0]?.value,
        role: expectedRole || USER_ROLES.STUDENT,
        is_verified: true,
      });
    } else if (!user.is_verified) {
      user = await this.usersService.verifyUser(user.id || user._id);
    }
    return this.generateToken(user);
  }

  async refreshToken(jwtUser: JwtUserPayload): Promise<AuthTokenResponseDto> {
    const user = await this.usersService.findById(jwtUser.id);
    if (!user) {
      throw new AppException(ErrorCode.USER_NOT_FOUND, AUTH_ERROR_MESSAGES.USER_NO_LONGER_EXISTS);
    }
    return this.generateToken(user);
  }

  async validateToken(token: string): Promise<UserModel | null> {
    try {
      const payload = this.jwtService.verify(token);
      return this.usersService.findById(payload.sub);
    } catch {
      return null;
    }
  }
}
