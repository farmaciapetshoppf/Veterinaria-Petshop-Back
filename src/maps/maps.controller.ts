import { Controller, Get, HttpException, HttpStatus, InternalServerErrorException, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import fetch from 'node-fetch';

@Controller('api/directions')
export class MapsController {
    private readonly maptilerApiKey: string;
    private readonly localCoords: string;

    constructor(private readonly configService: ConfigService) {
        const maptilerKey = this.configService.get<string>('MAPTILER_API_KEY');
        const localLat= this.configService.get<string>('LOCAL_LATITUD');
        const localLong= this.configService.get<string>('LOCAL_LONGITUD');

        if(!maptilerKey || !localLat || !localLong) {
            throw new InternalServerErrorException ('Faltan variables de entorno MapTiler')
        }

        this.maptilerApiKey = maptilerKey;
        this.localCoords = `${localLong},${localLat}`;
    }

    @Get()
        async getRoute(
            @Query('clientLong') clientLong: string,
            @Query('clientLat') clientLat: string,
        ) {
                if (!clientLong || !clientLat) {
                    throw new HttpException('Faltan coordenadas del cliente.', HttpStatus.BAD_REQUEST);
                }
                const clientCoords = `${clientLong}, ${clientLat}`;

                const url= `https://api.maptiler.com/directions/v1/driving/${clientCoords};${this.localCoords}?key=${this.maptilerApiKey}`;

                try{
                    const response = await fetch(url);

                    if(!response.ok) {
                        throw new Error (`Error de Maptiler: ${response.statusText}`);
                    }
                    const data = await response.json();

                    return data;
                } catch(error) {
                    console.error('Error en el proxy de MapTiler:', error);
                    throw new HttpException('No se pudo calcular la ruta.', HttpStatus.SERVICE_UNAVAILABLE);
                }
            }
        
    
}
