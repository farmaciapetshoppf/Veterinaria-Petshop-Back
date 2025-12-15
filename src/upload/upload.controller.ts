// src/upload/upload.controller.ts
import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  InternalServerErrorException,
  Param,
  Delete,
  Get,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from '../supabase/storage.service';
import {
  ApiTags,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import {
  UploadResponseDto,
  DeleteResponseDto,
  FileInfoDto,
} from './dto/upload-response.dto';

// Definir la interfaz del archivo para evitar errores de tipos
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

@ApiTags('uploads')
@Controller('upload')
export class UploadController {
  constructor(private storageService: StorageService) {}

  @Post('image')
  @ApiOperation({ summary: 'Upload image to supabase DDBB' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo de imagen a subir',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'El archivo se subio correctamente',
    type: UploadResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Archivo invalido o no se subio un archivo',
  })
  @ApiResponse({
    status: 500,
    description: 'Error en el servidor al subir archivo',
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: MulterFile) {
    if (!file) {
      throw new BadRequestException('No se subio un archivo');
    }

    if (!file.mimetype.includes('image/')) {
      throw new BadRequestException('El archivo debe ser una imagen');
    }

    // Asegurarse de que el servicio de almacenamiento acepta el mismo tipo de archivo
    const result = await this.storageService.uploadFile(file, 'images');

    if (!result) {
      throw new InternalServerErrorException('Error al subir imagen');
    }

    return { success: true, url: result.publicUrl };
  }

  @Delete('image/:path')
  @ApiOperation({ summary: 'Delete image from supabase' })
  @ApiParam({
    name: 'path',
    description: 'Ruta de la imagen a eliminar (e.g., 1638276543123_image.jpg)',
    required: true,
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'La imagen ha sido borrada exitosamente',
    type: DeleteResponseDto,
  })
  @ApiResponse({ status: 500, description: 'Error en el servidor al borrar' })
  async deleteImage(@Param('path') path: string) {
    const success = await this.storageService.deleteFile('images', path);

    if (!success) {
      throw new InternalServerErrorException('Error al borrar imagen');
    }

    return { success: true };
  }

  @Get('images')
  @ApiOperation({ summary: 'List all images' })
  @ApiResponse({
    status: 200,
    description: 'Listar todas las imagenes',
    type: [FileInfoDto],
  })
  @ApiResponse({
    status: 500,
    description: 'Error en el servidor al listar imagenes',
  })
  async listImages() {
    const files = await this.storageService.listFiles('images');

    if (!files) {
      throw new InternalServerErrorException('Error al listar imagenes');
    }

    return files;
  }

  @Get('images/:folder')
  @ApiOperation({ summary: 'List images by folder' })
  @ApiParam({
    name: 'folder',
    description: 'Ruta de la carpeta',
    required: true,
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de imagenes en una carpeta especifica',
    type: [FileInfoDto],
  })
  @ApiResponse({ status: 500, description: 'Error en el servidor' })
  async listImagesInFolder(@Param('folder') folder: string) {
    const files = await this.storageService.listFiles('images', folder);

    if (!files) {
      throw new InternalServerErrorException('Error al listar imagenes');
    }

    return files;
  }
}
