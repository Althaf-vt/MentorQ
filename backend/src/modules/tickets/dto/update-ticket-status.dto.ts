import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateTicketStatusDto {
  @IsString()
  @IsNotEmpty({ message: 'Status is required.' })
  status: string;

  @IsOptional()
  @IsString()
  feedback_note?: string;
}
