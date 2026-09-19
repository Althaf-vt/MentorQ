import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class ResolveGuidanceDto {
  @IsString()
  @MinLength(10, { message: 'Guidance message must be at least 10 characters long' })
  @MaxLength(1000, { message: 'Guidance message cannot exceed 1000 characters' })
  @Matches(/^(?=.*[a-zA-Z0-9])[a-zA-Z0-9\s\S]+$/, { message: 'Guidance message must contain meaningful alphanumeric text' })
  message: string;
}
