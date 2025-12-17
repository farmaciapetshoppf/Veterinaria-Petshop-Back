import { Controller, Get, HttpException, HttpStatus, Query } from '@nestjs/common';
import { MaptilerService } from './maps.service'; // Asegúrate de que la ruta de importación sea correcta

@Controller('api/directions')
export class MapsController {
    // Inyectamos el servicio
    constructor(private readonly maptilerService: MaptilerService) {}

  
    // ENDPOINT 1: Obtener Coordenadas del Local (Para el Frontend)
    // URL: GET /api/directions/local
  
    @Get('local')
    getLocalCoords() {
        return {
            long: parseFloat(this.maptilerService.localLong),
            lat: parseFloat(this.maptilerService.localLat)
        };
    }

   
    // ENDPOINT 2: Servidor Proxy para Calcular la Ruta
    // URL: GET /api/directions?clientLong=X&clientLat=Y
   
    @Get()
    async getRoute(
        @Query('clientLong') clientLong: string,
        @Query('clientLat') clientLat: string,
    ) {
        if (!clientLong || !clientLat) {
            throw new HttpException('Faltan coordenadas del cliente (clientLong y clientLat).', HttpStatus.BAD_REQUEST);
        }
        
        try {
            // Llama al método del servicio para obtener la ruta
            const data = await this.maptilerService.getDirectionsRoute(clientLong, clientLat);
            
            return data;
        } catch(error) {
            console.error('Error en el proxy:', error);
            // Devolver un error genérico al cliente si el servicio falló
            throw new HttpException('No se pudo calcular la ruta.', HttpStatus.SERVICE_UNAVAILABLE);
        }
    }
}
