import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseLoggerService } from './database-logger.service';
import { typeormConfig } from 'src/config/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync(typeormConfig)
  ],
  providers: [DatabaseLoggerService],
})
export class DatabaseModule {}
