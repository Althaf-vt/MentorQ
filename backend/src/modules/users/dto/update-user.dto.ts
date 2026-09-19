import { IsString, Length, Matches, IsOptional, ValidateNested, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';

class SocialLinksDto {
  @IsOptional()
  @IsUrl()
  @Matches(/^https:\/\/(www\.)?linkedin\.com\/.*/, { message: 'Must be a valid LinkedIn URL.' })
  linkedin?: string;

  @IsOptional()
  @IsUrl()
  @Matches(/^https:\/\/(www\.)?github\.com\/.*/, { message: 'Must be a valid GitHub URL.' })
  github?: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Length(2, 50, { message: 'Full name must be between 2 and 50 characters.' })
  @Matches(/^[a-zA-Z\s'\-]+$/, { message: 'Full name can only contain letters, spaces, hyphens, and apostrophes.' })
  fullName?: string;

  @IsOptional()
  @IsString()
  @Length(10, 500, { message: 'Bio must be between 10 and 500 characters.' })
  @Matches(/[a-zA-Z]{3,}/, { message: 'Bio must contain coherent sentences.' })
  bio?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => SocialLinksDto)
  socialLinks?: SocialLinksDto;
}
