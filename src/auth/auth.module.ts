import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SupabaseModule } from 'src/supabase/supabase.module';
import { UsersModule } from 'src/users/users.module';
import { AuthGuard } from './guards/auth.guard';
import { MailerModule } from 'src/mailer/mailer.module';
import { VeterinariansModule } from 'src/veterinarians/veterinarians.module';

@Module({
  imports: [
    SupabaseModule,
    UsersModule,
    forwardRef(() => VeterinariansModule),
    MailerModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard],
  exports: [AuthService, AuthGuard],
})
export class AuthModule {}
