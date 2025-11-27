import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from 'src/supabase/supabase.service';
import { UsersService } from 'src/users/users.service';
import { SignUpDto } from './dto/singup.dto';
import { SignInDto } from './dto/signin.dto';
import { Role } from './enum/roles.enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly usersService: UsersService,
  ) {}

  async signUp(signUpDto: SignUpDto) {
    const { name, email, password, user, phone, country, address, city, role } =
      signUpDto;

    const { data, error: authError } = await this.supabaseService
      .getClient()
      .auth.signUp({
        email: email,
        password,
      });

    if (authError) {
      throw new Error(`Authentication error: ${authError.message}`);
    }

    if (data && data.user) {
      const newUser = await this.usersService.createUser({
        id: data.user.id,
        email,
        name,
        user,
        phone,
        country,
        address,
        city,
        role: Role.User,
      });

      return {
        message:
          'User registered successfully. Please check your email for verification.',
        user: newUser,
      };
    }

    return {
      message:
        'User registration initiated. Please check your email for verification.',
    };
  }

  async signIn(signInDto: SignInDto) {
    const { email, password } = signInDto;

    const { data, error } = await this.supabaseService
      .getClient()
      .auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const userProfile = await this.usersService.getUserById(data.user.id);

    return {
      message: 'Signed in successfully',
      user: userProfile,
      session: data.session,
    };
  }

  async signOut(token: string) {
    try {
      const supabaseClient = this.supabaseService.getClient();

      const { error } = await supabaseClient.auth.signOut({});

      if (error) {
        throw new Error(`Error during sign out: ${error.message}`);
      }

      return { message: 'Successfully signed out' };
    } catch (error) {
      throw new Error(`Sign out failed: ${error.message}`);
    }
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
