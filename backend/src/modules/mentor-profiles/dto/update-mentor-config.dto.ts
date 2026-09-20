import { IsString, Matches, IsInt, Min, Max, Validate, ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments, ValidateNested, IsBoolean, IsOptional, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

@ValidatorConstraint({ name: 'isBeforeEndTime', async: false })
export class IsBeforeEndTimeConstraint implements ValidatorConstraintInterface {
  validate(startTime: string, args: ValidationArguments) {
    const object = args.object as any;
    if (!startTime || !object.endTime) return false;
    
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = object.endTime.split(':').map(Number);
    
    if (startH < endH) return true;
    if (startH === endH && startM < endM) return true;
    return false;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Start time must be before end time.';
  }
}

class OperatingHoursDto {
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Start time must be in HH:mm format.' })
  @Validate(IsBeforeEndTimeConstraint)
  startTime: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'End time must be in HH:mm format.' })
  endTime: string;
}

@ValidatorConstraint({ name: 'isWithinOperatingHours', async: false })
export class IsWithinOperatingHoursConstraint implements ValidatorConstraintInterface {
  validate(dailyAvailability: number, args: ValidationArguments) {
    const object = args.object as any;
    const operatingHours = object.operatingHours;
    if (!operatingHours || !operatingHours.startTime || !operatingHours.endTime) return true; // Handled by other validators

    const [startH, startM] = operatingHours.startTime.split(':').map(Number);
    const [endH, endM] = operatingHours.endTime.split(':').map(Number);

    const totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    return dailyAvailability <= totalMinutes;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Daily availability cannot exceed total operating hours window.';
  }
}

export class UpdateMentorConfigDto {
  @ValidateNested()
  @Type(() => OperatingHoursDto)
  operatingHours: OperatingHoursDto;

  @IsInt()
  @Min(15)
  @Max(1440)
  @Validate(IsWithinOperatingHoursConstraint)
  dailyAvailability: number;

  @IsOptional()
  @IsBoolean()
  isOnline?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  expertiseTags?: string[];
}
