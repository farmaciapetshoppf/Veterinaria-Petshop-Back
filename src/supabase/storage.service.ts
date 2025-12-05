// src/supabase/storage.service.ts
import { Injectable } from '@nestjs/common';
import { SupabaseService } from './supabase.service';

// Definir la interfaz del archivo que coincida con la usada en el controlador
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

@Injectable()
export class StorageService {
  constructor(private supabaseService: SupabaseService) {}

  async uploadFile(
    file: MulterFile,
    bucketName: string,
    path?: string,
  ): Promise<{ publicUrl: string } | null> {
    try {
      const supabase = this.supabaseService.getClient();

      // Generar un nombre único para el archivo
      const fileName = `${Date.now()}_${file.originalname}`;
      const filePath = path ? `${path}/${fileName}` : fileName;

      // Subir el archivo a Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Error uploading file:', error);
        return null;
      }

      // Obtener la URL pública del archivo - CORREGIDO
      const publicUrlResponse = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      return publicUrlResponse.data;
    } catch (error) {
      console.error('Unexpected error during file upload:', error);
      return null;
    }
  }

  async deleteFile(bucketName: string, filePath: string): Promise<boolean> {
    try {
      const supabase = this.supabaseService.getClient();

      const { error } = await supabase.storage
        .from(bucketName)
        .remove([filePath]);

      if (error) {
        console.error('Error deleting file:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Unexpected error during file deletion:', error);
      return false;
    }
  }

  async listFiles(bucketName: string, folderPath?: string) {
    try {
      const supabase = this.supabaseService.getClient();

      const { data, error } = await supabase.storage
        .from(bucketName)
        .list(folderPath || '');

      if (error) {
        console.error('Error listing files:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Unexpected error during file listing:', error);
      return null;
    }
  }
}
