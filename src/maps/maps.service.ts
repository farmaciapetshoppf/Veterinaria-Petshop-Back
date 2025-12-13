import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import fetch from 'node-fetch';

@Injectable()
export class MaptilerService {
    private readonly maptilerApiKey: string;
    public readonly localCoords: string;
    public readonly localLong: string;
    public readonly localLat: string;

    constructor(private readonly configService: ConfigService) {
        const maptilerKey = this.configService.get<string>('MAPTILER_API_KEY');
        const localLat= this.configService.get<string>('LOCAL_LATITUD');
        const localLong= this.configService.get<string>('LOCAL_LONGITUD');

        if (!maptilerKey || !localLat || !localLong) {
            throw new InternalServerErrorException(
                'Faltan variables de entorno MapTiler críticas.'
            );
        }

        this.maptilerApiKey = maptilerKey;
        this.localLong = localLong; 
        this.localLat = localLat;   
        this.localCoords = `${localLong},${localLat}`;
    }
    
    // Método que llama a la API de Directions de MapTiler (Lógica del Proxy)
    async getDirectionsRoute(clientLong: string, clientLat: string): Promise<any> {
        const clientCoords = `${clientLong},${clientLat}`;
        const url = `https://api.maptiler.com/directions/v1/driving/${clientCoords};${this.localCoords}?key=${this.maptilerApiKey}`;

        try {
            const response = await fetch(url);

            if (!response.ok) {
                // Captura errores de la API externa (400, 404, etc.)
                const errorText = await response.text();
                // En lugar de usar el statusText de fetch, usamos el cuerpo para más detalle
                throw new Error(`MapTiler API Error: ${response.status} - ${errorText.substring(0, 100)}...`); 
            }
            
            return response.json();
        } catch(error) {
            // ** SOLUCIÓN AL ERROR 'unknown' **
            let errorMessage = 'Error desconocido en la comunicación con MapTiler.';
            
            // 1. Verificación para asegurar que 'error' es un objeto de Error o tiene un mensaje
            if (error instanceof Error) {
                errorMessage = error.message;
            } else if (typeof error === 'object' && error !== null && 'message' in error) {
                // Maneja objetos que se parecen a errores pero no son instancias de Error (común en JS)
                errorMessage = (error as { message: string }).message;
            }

            // 2. Lanzar la excepción de NestJS con el mensaje seguro
            throw new InternalServerErrorException(`Fallo en el proxy de MapTiler: ${errorMessage}`);
        }
    }
}