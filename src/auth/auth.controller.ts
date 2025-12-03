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
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/singup.dto';
import { SignInDto } from './dto/signin.dto';
import { ApiBody, ApiOperation } from '@nestjs/swagger';
import type { Response, Request } from 'express';
import { AuthGuard } from './guards/auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Register user' })
  @Post('signup')
  signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto);
  }

  @ApiOperation({ summary: 'Login user' })
  @Post('signin')
  @HttpCode(200)
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
  getProfile(@Req() req: Request) {
    return (req as any).user;
  }

  @ApiOperation({ summary: 'Google OAuth URL' })
  @Get('google/url')
  getGoogleAuthURL() {
    return this.authService.getGoogleAuthURL();
  }

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
