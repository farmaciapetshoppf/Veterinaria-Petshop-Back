import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; 
import { MapsController } from './maps.controller';
import { MaptilerService } from './maps.service';

@Module({
   
    imports: [ConfigModule],
    controllers: [MapsController],
    providers: [MaptilerService],
   
})
export class MapsModule {}