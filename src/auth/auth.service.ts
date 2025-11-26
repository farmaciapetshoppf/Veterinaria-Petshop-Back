import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  getAuth() {
    return 'Get authentication';
  }

  signUp() {
    return 'User signed up';
  }

  signIn() {
    return 'User signed in';
  }

  signOut() {
    return 'User signed out';
  }

  requestPasswordReset() {
    return 'Request password reset (send email)';
  }

  resetPassword() {
    return 'Change to new password';
  }

  updatePassword() {
    return 'Update new password';
  }
}
