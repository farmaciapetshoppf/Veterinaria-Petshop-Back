import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
  Matches,
  MinLength,
} from 'class-validator';
import { Role } from '../enum/roles.enum';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';

export class SignUpDto {
  @ApiProperty({
    description: 'Debe ser un string, no puede estar vacio',
    example: 'Nombre-Apellido',
    type: 'string',
    required: true,
  })
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  name: string;

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

  @ApiProperty({
    description: 'Debe ser un string.',
    example: 'Usuario',
    type: 'string',
    required: true,
  })
  @IsString({ message: 'El usuario debe ser texto' })
  @IsNotEmpty({ message: 'El usuario es obligatoria' })
  user: string;

  @ApiProperty({
    description: 'Debe ser un numero.',
    example: '+541234567890',
    type: 'string',
    required: true,
  })
  @IsString({ message: 'El telefono debe ser texto' })
  @IsNotEmpty({ message: 'El telefono es obligatoria' })
  @Matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,10}[-\s.]?[0-9]{1,10}$/, {
    message: 'El teléfono debe tener un formato válido',
  })
  phone: string;

  @ApiProperty({
    description: 'Debe ser un string.',
    example: 'Pais Falso',
    type: 'string',
    required: true,
  })
  @IsString({ message: 'El pais debe ser texto' })
  @IsNotEmpty({ message: 'El pais es obligatoria' })
  country: string;

  @ApiProperty({
    description: 'Debe ser un string.',
    example: 'Calle Falsa',
    type: 'string',
    required: true,
  })
  @IsString({ message: 'La direccion debe ser texto' })
  @IsNotEmpty({ message: 'La direccion es obligatoria' })
  address: string;

  @ApiProperty({
    description: 'Debe ser un string.',
    example: 'Ciudad Falsa',
    type: 'string',
    required: true,
  })
  @IsString({ message: 'La ciudad debe ser texto' })
  @IsNotEmpty({ message: 'La ciudad es obligatoria' })
  city: string;

  @ApiHideProperty()
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
