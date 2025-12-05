// src/mailer/mailer.service.ts

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { google } from 'googleapis';

@Injectable()
export class MailerService {
  private transporter: nodemailer.Transporter;
  private readonly emailUser: string; // Propiedad de la clase para el remitente

  constructor(private readonly configService: ConfigService) {
    // 1. Lectura crucial: Obtenemos el correo del remitente en el constructor
    const emailUser = this.configService.get<string>('MAIL_USER');

    if (!emailUser) {
        // En NestJS, es mejor lanzar un error en el constructor si falta una dependencia clave
        throw new Error('La variable MAIL_USER es crucial y no está definida en .env.');
    }
    this.emailUser = emailUser; // Asignamos la variable a la propiedad de la clase
    
    // 2. Iniciamos el transporter de forma asíncrona
    this.initializeTransporter();
  }

  private async initializeTransporter() {
    // 3. Leemos las credenciales de OAuth2 (solo necesarias aquí dentro)
    const CLIENT_ID = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const CLIENT_SECRET = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    const REFRESH_TOKEN = this.configService.get<string>('GOOGLE_REFRESH_TOKEN');
    const REDIRECT_URI = this.configService.get<string>('GOOGLE_REDIRECT_URI');
    
    if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN || !REDIRECT_URI) {
      console.error('ERROR: Faltan credenciales de OAuth2. El servicio de correo no funcionará.');
      return; 
    }

    // 4. Configurar cliente OAuth2
    const oAuth2Client = new google.auth.OAuth2(
      CLIENT_ID,
      CLIENT_SECRET,
      REDIRECT_URI,
    );
    oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

    try {
      // 5. Obtener Access Token
      const accessTokenResponse = await oAuth2Client.getAccessToken();
      const accessToken = accessTokenResponse.token;

      if (!accessToken) {
        throw new Error('No se pudo generar el Access Token para Nodemailer.');
      }

      // 6. Crear el Transporter
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: this.emailUser, // Usamos la propiedad de la clase
          clientId: CLIENT_ID,
          clientSecret: CLIENT_SECRET,
          refreshToken: REFRESH_TOKEN,
          accessToken: accessToken,
        },
      } as nodemailer.TransportOptions);

    } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error fatal al configurar el servicio de correo:', errorMessage);
      // No relanzamos, solo registramos el error para que la app pueda iniciar
      // pero el transporter permanecerá 'undefined', lo que será manejado en sendMail.
    }
  }

  /**
   * Envía un correo electrónico. Este es el método inyectable.
   * @param to Correo del destinatario.
   * @param subject Asunto del correo.
   * @param htmlContent Contenido HTML del cuerpo.
   */
  async sendMail(to: string, subject: string, htmlContent: string): Promise<void> {
    // 1. Verificación de inicialización
    if (!this.transporter) {
        throw new InternalServerErrorException('El servicio de correo no pudo inicializarse. Revise las credenciales en .env.');
    }
    
    // 2. Opciones del correo
    const mailOptions = {
      from: `Huellitas Pet🐾 <${this.emailUser}>`, // Usamos la propiedad de la clase para el FROM
      to,
      subject,
      html: htmlContent,
    };

    // 3. Envío
    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('Correo enviado exitosamente. Message ID:', result.messageId);
    } catch (error) {
      console.error('Fallo el envío de correo:', error);
      // Relanzamos el error para que el AuthService pueda capturarlo y generar un 'warn'
      throw new InternalServerErrorException('Fallo al contactar al servidor de correo durante el envío.');
    }
  }
}