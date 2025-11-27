import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ChangePasswordVeterinarianDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @IsString()
  @IsNotEmpty()
  newPassword: string;

  @IsString()
  @IsNotEmpty()
  repeatNewPassword: string;
}
