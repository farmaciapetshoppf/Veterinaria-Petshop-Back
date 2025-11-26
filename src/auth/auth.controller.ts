import { Controller, Get, Post, Put } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  getAuth() {
    return this.authService.getAuth();
  }

  @Post('signup')
  signUp() {
    return this.authService.signUp();
  }

  @Post('signin')
  signIn() {
    return this.authService.signIn();
  }

  @Post('signout')
  signOut() {
    return this.authService.signOut();
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
}
