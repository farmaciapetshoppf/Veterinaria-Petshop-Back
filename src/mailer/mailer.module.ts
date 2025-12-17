import { Module } from '@nestjs/common';
import { MailerModule as NestMailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerService } from './mailer.service';
import { join } from 'path';
import { google } from 'googleapis';

@Module({
  imports: [
    ConfigModule,
    NestMailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const CLIENT_ID = configService.get<string>('GOOGLE_MAIL_CLIENT_ID');
        const CLIENT_SECRET = configService.get<string>(
          'GOOGLE_MAIL_CLIENT_SECRET',
        );
        const REFRESH_TOKEN = configService.get<string>('GOOGLE_REFRESH_TOKEN');
        const REDIRECT_URI = configService.get<string>('GOOGLE_REDIRECT_URI');
        const MAIL_USER = configService.get<string>('MAIL_USER');

        // Si no hay credenciales, usar modo básico
        if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
          console.warn(
            '⚠️  Credenciales de Google OAuth incompletas. Mailer en modo básico (emails no se enviarán).',
          );
          return {
            transport: {
              host: 'localhost',
              port: 1025,
              secure: false,
              ignoreTLS: true,
            },
            defaults: {
              from: `"Huellitas Pet 🐾" <${MAIL_USER || 'noreply@veterinariapetshop.com'}>`,
            },
            template: {
              dir: join(__dirname, 'templates'),
              adapter: new HandlebarsAdapter(),
              options: {
                strict: true,
              },
            },
          };
        }

        try {
          const oAuth2Client = new google.auth.OAuth2(
            CLIENT_ID,
            CLIENT_SECRET,
            REDIRECT_URI,
          );

          oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

          const accessTokenResponse = await oAuth2Client.getAccessToken();
          const accessToken = accessTokenResponse.token;

          return {
            transport: {
              service: 'gmail',
              auth: {
                type: 'OAuth2',
                user: MAIL_USER,
                clientId: CLIENT_ID,
                clientSecret: CLIENT_SECRET,
                refreshToken: REFRESH_TOKEN,
                accessToken: accessToken,
              },
              tls: { rejectUnauthorized: false },
            } as any,
            defaults: {
              from: `"Huellitas Pet 🐾" <${MAIL_USER}>`,
            },
            template: {
              dir: join(__dirname, 'templates'),
              adapter: new HandlebarsAdapter(),
              options: {
                strict: true,
              },
            },
          };
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Error desconocido';
          console.error(
            '❌ Error al configurar Google OAuth para mailer:',
            errorMessage,
          );
          console.warn(
            '⚠️  Mailer funcionará en modo básico (emails no se enviarán).',
          );
          return {
            transport: {
              host: 'localhost',
              port: 1025,
              secure: false,
              ignoreTLS: true,
            },
            defaults: {
              from: `"Huellitas Pet 🐾" <${MAIL_USER || 'noreply@veterinariapetshop.com'}>`,
            },
            template: {
              dir: join(__dirname, 'templates'),
              adapter: new HandlebarsAdapter(),
              options: {
                strict: true,
              },
            },
          };
        }
      },
    }),
  ],
  providers: [MailerService],
  exports: [MailerService],
})
export class MailerModule {}
