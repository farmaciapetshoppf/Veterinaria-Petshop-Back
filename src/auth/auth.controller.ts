/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Body,
  Controller,
  Post,
  Put,
  HttpCode,
  Res,
  Get,
  Req,
  BadRequestException,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/singup.dto';
import { SignInDto } from './dto/signin.dto';
import { ApiBody, ApiOperation } from '@nestjs/swagger';
import type { Response, Request } from 'express';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Public } from 'src/decorators/public.decorator';

@Controller('auth')
@UseGuards(AuthGuard, RolesGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Register user' })
  @Post('signup')
  @Public()
  signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto);
  }

  @ApiOperation({ summary: 'Login user' })
  @Post('signin')
  @HttpCode(200)
  @Public()
  async signIn(
    @Body() signInDto: SignInDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.signIn(signInDto, res);
  }

  @ApiOperation({ summary: 'Signout user' })
  @Post('signout')
  @HttpCode(200)
  async signOut(@Res({ passthrough: true }) res: Response) {
    return this.authService.signOut(res);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async getProfile(@Req() req: Request) {
    try {
      const userId = (req as any).user.id; // Asegúrate de que el guardia coloca el usuario en la solicitud
      const user = await this.authService.getUserProfile(userId); // Obteniendo desde el servicio SQL
      return user;
    } catch (error) {
      throw new UnauthorizedException(
        'No se pudo obtener el perfil del usuario',
      );
    }
  }

  @ApiOperation({ summary: 'Google OAuth URL' })
  @Get('google/url')
  @Public()
  getGoogleAuthURL() {
    return this.authService.getGoogleAuthURL();
  }

  @ApiOperation({ summary: 'Handle OAuth callback' })
  @Get('callback')
  @Public()
  async handleCallback(
    @Query('code') code: string,
    @Query('hash') hash: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Determinar si estamos procesando un código o un hash
    const urlFragment = code || hash;

    if (!urlFragment) {
      throw new BadRequestException('Falta el código o hash de autenticación');
    }

    // Agregar logs para depuración
    console.log('Procesando callback con fragmento:', urlFragment);

    return this.authService.handleAuthCallback(urlFragment, res);
  }

  // Mantener el endpoint anterior para compatibilidad
  @ApiOperation({ summary: 'Handle successful OAuth authentication' })
  @ApiBody({
    description: 'OAuth access token data',
    type: 'object',
    schema: {
      properties: {
        access_token: {
          type: 'string',
          description:
            'OAuth access token obtained from authentication provider',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
      required: ['access_token'],
    },
  })
  @Post('session')
  @Public()
  async handleSession(
    @Body() sessionData: { access_token: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.handleSession(sessionData.access_token, res);
  }

  @ApiOperation({ summary: 'On construction' })
  @Post('password/reset-request')
  requestPasswordReset() {
    return this.authService.requestPasswordReset();
  }

  @ApiOperation({ summary: 'On construction' })
  @Post('password/reset')
  resetPassword() {
    return this.authService.resetPassword();
  }

  @ApiOperation({ summary: 'On construction' })
  @Put('password')
  updatePassword() {
    return this.authService.updatePassword();
  }
}
