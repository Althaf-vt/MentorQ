import { IsOptional, IsBoolean, IsString, IsUrl } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsBoolean()
  allowStudentRegistration?: boolean;

  @IsOptional()
  @IsBoolean()
  allowMentorRegistration?: boolean;

  @IsOptional()
  @IsString()
  platformName?: string;

  @IsOptional()
  @IsString()
  platformDescription?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;
}
