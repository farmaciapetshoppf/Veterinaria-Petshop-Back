import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MinLength,
} from 'class-validator';

export class SignInDto {
  @ApiProperty({
    description: 'Debe ser un email valido.',
    example: 'Usuario01@mail.com',
    type: 'string',
    required: true,
  })
  @IsEmail({}, { message: 'Debe ser un email válido' })
  @IsString({ message: 'El email debe ser texto' })
  @IsNotEmpty({ message: 'El email es obligatorio' })
  email: string;

  @ApiProperty({
    description:
      'Debe ser un string de minimo 8 caracteres, debe contener una letra mayúscula, una letra minúscula, un número y un símbolo.',
    example: 'Usuario1!',
    type: 'string',
    required: true,
  })
  @IsString({ message: 'La contraseña debe ser texto' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @IsStrongPassword(
    {
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message:
        'La contraseña debe tener al menos una letra mayúscula, una letra minúscula, un número y un símbolo.',
    },
  )
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string;
}
