import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ChangePasswordVeterinarianDto {
  @ApiProperty({
    description: 'Correo electrónico del veterinario (debe ser único)',
    example: 'juan.perez@vetclinic.com',
    type: 'string',
    format: 'email',
    maxLength: 100,
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Contraseña actual de la cuenta',
    example: 'Password1!',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({
    description: 'Nueva contraseña para la cuenta',
    example: 'juanPerez1!',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  newPassword: string;

  @ApiProperty({
    description: 'Repetir nueva contraseña para la cuenta',
    example: 'juanPerez1!',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  repeatNewPassword: string;
}
