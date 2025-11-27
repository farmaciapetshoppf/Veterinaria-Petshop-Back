import { Module } from '@nestjs/common';
import { DatabaseLoggerService } from './database-logger.service';


@Module({
  providers: [DatabaseLoggerService],
  exports: [DatabaseLoggerService]
})
export class DatabaseModule {}
