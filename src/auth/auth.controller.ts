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
import { ApiOperation } from '@nestjs/swagger';
import type { Response } from 'express';
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

  @Post('password/reset-request')
  requestPasswordReset() {
    return this.authService.requestPasswordReset();
  }

  @Post('password/reset')
  resetPassword() {
    return this.authService.resetPassword();
  }

  @Put('password')
  updatePassword() {
    return this.authService.updatePassword();
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async getProfile(@Req() req: Request) {
    return (req as any).user;
  }
}
