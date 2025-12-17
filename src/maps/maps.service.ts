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
                // MapTiler no disponible - retornar respuesta amigable sin lanzar error
                console.log(`ℹ️ MapTiler no disponible (${response.status}). El cálculo de envío usa distancia GPS directa.`);
                return {
                    error: 'MapTiler no disponible',
                    message: 'El servicio de rutas de MapTiler no está disponible. Se usa cálculo de distancia GPS directa.',
                    status: response.status,
                    fallback: 'gps_distance'
                };
            }
            
            return response.json();
        } catch(error) {
            // Retornar respuesta amigable en lugar de lanzar error
            console.log(`ℹ️ MapTiler no disponible. El cálculo de envío usa distancia GPS directa.`);
            
            return {
                error: 'MapTiler no disponible',
                message: 'El servicio de rutas de MapTiler no está disponible. Se usa cálculo de distancia GPS directa (Haversine).',
                fallback: 'gps_distance'
            };
        }
    }
}