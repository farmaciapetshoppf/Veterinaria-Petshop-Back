import { Body, Controller, Post, Put } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/singup.dto';
import { SignInDto } from './dto/signin.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto);
  }

  @Post('signin')
  signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto);
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
