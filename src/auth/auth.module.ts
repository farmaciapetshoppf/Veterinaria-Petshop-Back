import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SupabaseModule } from 'src/supabase/supabase.module';
import { UsersModule } from 'src/users/users.module';
import { AuthGuard } from './guards/auth.guard';

@Module({
  imports: [SupabaseModule, UsersModule],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard],
  exports: [AuthService, AuthGuard],
})
export class AuthModule {}
