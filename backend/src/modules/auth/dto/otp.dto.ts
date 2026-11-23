import { IsEmail, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class SendOtpDto {
  @IsEmail({}, { message: 'A valid email address is required.' })
  email: string;
}

export class VerifyOtpDto {
  @IsEmail({}, { message: 'A valid email address is required.' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'OTP is required.' })
  @Length(6, 6, { message: 'OTP must be 6 digits.' })
  otp: string;

  @IsOptional()
  @IsString()
  expectedRole?: string;
}
