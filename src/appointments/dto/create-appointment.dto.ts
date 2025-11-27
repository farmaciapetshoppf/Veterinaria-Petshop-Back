import {IsBoolean, IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID} from 'class-validator';

export class CreateAppointmentDto {

  @IsUUID()
  userId: string;

  @IsUUID()
  petId: string;

  @IsUUID()
  veterinarianId: string;

  @IsDateString()
  date: string;

  @IsString()
  @IsNotEmpty()
  time: string;

  @IsOptional()
  @IsString()
  detail?: string;

  @IsOptional()
  @IsBoolean()
  status?: boolean;
}

