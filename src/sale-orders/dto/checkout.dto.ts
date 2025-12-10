import { IsNotEmpty, IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CheckoutDto {
  @ApiProperty({
    description: 'URL de retorno cuando el pago es exitoso',
    example: 'https://tu-ngrok-frontend.ngrok-free.app/payment-result?status=success'
  })
  @IsNotEmpty()
  @IsString()
  success_url: string;

  @ApiProperty({
    description: 'URL de retorno cuando el pago falla',
    example: 'https://tu-ngrok-frontend.ngrok-free.app/payment-result?status=failure'
  })
  @IsNotEmpty()
  @IsString()
  failure_url: string;

  @ApiProperty({
    description: 'URL de retorno cuando el pago queda pendiente',
    example: 'https://tu-ngrok-frontend.ngrok-free.app/payment-result?status=pending'
  })
  @IsNotEmpty()
  @IsString()
  pending_url: string;

  @ApiPropertyOptional({
    description: 'Configuración de retorno automático',
    enum: ['approved', 'all'],
    example: 'approved'
  })
  @IsOptional()
  @IsIn(['approved', 'all'])
  auto_return?: 'approved' | 'all';
}
