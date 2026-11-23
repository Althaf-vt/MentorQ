import { IsOptional, IsString, MaxLength } from 'class-validator';

export class EndSessionDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Resolution notes cannot exceed 1000 characters.' })
  resolution_notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Resolution notes cannot exceed 1000 characters.' })
  resolutionNotes?: string;

  get notes(): string | undefined {
    return this.resolutionNotes || this.resolution_notes;
  }
}
