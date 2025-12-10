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
        // Configurar OAuth2
        const CLIENT_ID = configService.get<string>('GOOGLE_MAIL_CLIENT_ID');
        const CLIENT_SECRET = configService.get<string>('GOOGLE_MAIL_CLIENT_SECRET');
        const REFRESH_TOKEN = configService.get<string>('GOOGLE_REFRESH_TOKEN');
        const REDIRECT_URI = configService.get<string>('GOOGLE_REDIRECT_URI');
        const MAIL_USER = configService.get<string>('MAIL_USER');

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
      },
    }),
  ],
  providers: [MailerService],
  exports: [MailerService],
})
export class MailerModule {}
