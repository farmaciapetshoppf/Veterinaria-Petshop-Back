import { Injectable, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseLoggerService implements OnModuleInit {
  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    if (this.dataSource.isInitialized) {
      console.log(
        '\x1b[35m%s\x1b[0m',
        '🐶✨  🐱💖  🐰🌿 ¡Todo listo, chicos ! La base de datos está conectada 🚀',
      );
    } else {
      console.log(
        '\x1b[31m%s\x1b[0m',
        '❌ No se pudo conectar a la base de datos',
      );
    }
  }
}
