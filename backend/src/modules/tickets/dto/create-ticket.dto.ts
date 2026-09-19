import { IsString, Length, Matches, IsInt, IsPositive, IsArray, ArrayMinSize, ArrayMaxSize } from 'class-validator';

export class CreateTicketDto {
  @IsString()
  @Length(5, 100, { message: 'Topic must be between 5 and 100 characters.' })
  @Matches(/^[a-zA-Z].{2,}/, { message: 'Topic must contain meaningful alphanumeric text.' })
  topic: string;

  @IsString()
  @Length(15, 1000, { message: 'Description must be between 15 and 1000 characters.' })
  @Matches(/[a-zA-Z]{3,}/, { message: 'Description must be coherent prose.' })
  description: string;

  @IsInt()
  @IsPositive()
  requested_minutes: number;

  @IsArray()
  @ArrayMinSize(1, { message: 'Must provide at least 1 tag.' })
  @ArrayMaxSize(5, { message: 'Cannot provide more than 5 tags.' })
  @IsString({ each: true })
  @Length(2, 20, { each: true, message: 'Each tag must be between 2 and 20 characters.' })
  @Matches(/^[a-zA-Z0-9]+$/, { each: true, message: 'Tags must be alphanumeric without special characters.' })
  tags: string[];
}
