// src/upload/dto/upload-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class UploadResponseDto {
  @ApiProperty({
    example: true,
    description: 'Indica si la operación fue exitosa',
  })
  success: boolean;

  @ApiProperty({
    example:
      'https://your-project.supabase.co/storage/v1/object/public/images/1638276543123_image.jpg',
    description: 'URL publica de la imagen subida',
  })
  url: string;
}

export class DeleteResponseDto {
  @ApiProperty({
    example: true,
    description: 'Indica si el borrado fue exitoso',
  })
  success: boolean;
}

export class FileInfoDto {
  @ApiProperty({ example: 'image.jpg', description: 'Nombre de la imagen' })
  name: string;

  @ApiProperty({
    example: {
      mimetype: 'image/jpeg',
      size: 1024,
    },
    description: 'Metadata de la imagen',
  })
  metadata?: {
    mimetype?: string;
    size?: number;
  };

  @ApiProperty({
    example: '1638276543123',
    description: 'Tiempo de creacion de la imagen',
  })
  created_at?: string;
}
