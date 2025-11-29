import {IsBoolean, IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID} from 'class-validator';
import { DateUtils } from 'typeorm/browser/util/DateUtils.js';

export class CreateAppointmentDto {

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsUUID()
  petId?: string;

  @IsOptional()
  @IsUUID()
  veterinarianId?: string;

  @IsDateString()
  date: Date;

  @IsString()
  @IsNotEmpty()
  time: Date;

  @IsOptional()
  @IsString()
  detail?: string;

  @IsOptional()
  @IsBoolean()
  status?: boolean;
}

