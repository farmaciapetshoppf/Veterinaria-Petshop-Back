import { IsEmail, IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';
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
  @IsNotEmpty()
  phone: string;
  @IsString()
  @IsNotEmpty()
  country: string;
  @IsString()
  @IsNotEmpty()
  address: string;
  @IsString()
  @IsNotEmpty()
  city: string;
  @IsNotEmpty()
  @IsEnum(Role)
  role?: Role;
}
