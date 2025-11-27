import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Role } from 'src/auth/enum/roles.enum';

export class CreateUserDto {
  @IsUUID()
  @IsNotEmpty()
  id: string;
  //orders: Orders[]
  //pets: Pets[]
  @IsString()
  @IsNotEmpty()
  name: string;
  @IsEmail()
  @IsString()
  @IsNotEmpty()
  email: string;
  @IsString()
  @IsNotEmpty()
  user: string;
  @IsString()
  @IsOptional()
  phone: number;
  @IsString()
  @IsOptional()
  country: string;
  @IsString()
  @IsOptional()
  address: string;
  @IsString()
  @IsOptional()
  city: string;
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
