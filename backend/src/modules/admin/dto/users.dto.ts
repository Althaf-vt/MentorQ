import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateUserStatusDto {
  @IsEnum(['ACTIVE', 'SUSPENDED', 'BANNED'], { message: 'Status must be ACTIVE, SUSPENDED, or BANNED' })
  @IsNotEmpty()
  status: string;
}
