import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { SupabaseService } from './supabase/supabase.service';
import { MailerService } from './mailer/mailer.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly supabaseService: SupabaseService,
    private readonly mailerService: MailerService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  @Get('test-supabase')
  async testSupabase() {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('test_connection')
      .select('*')
      .limit(1);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  }

  @Get('test-email')
  async testEmail() {
    try {
      // Test email bienvenida con contraseña temporal (veterinarios)
      await this.mailerService.sendWelcomeEmail({
        to: 'adrianmespindola@gmail.com',
        userName: 'Adrián Espíndola',
        temporaryPassword: 'TempPass123!@#',
      });

      // Test email confirmación turno
      await this.mailerService.sendAppointmentConfirmation({
        to: 'ani.calvo.97@gmail.com',
        userName: 'Ani Calvo',
        appointmentDate: '15/12/2025',
        appointmentTime: '14:30',
        petName: 'Max',
        veterinarianName: 'Dra. Abigail Brea',
        reason: 'Consulta general - PRUEBA',
      });

      return { success: true, message: 'Emails de prueba enviados correctamente' };
    } catch (error) {
      return { 
        success: false, 
        message: 'Error al enviar email', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  @Get('clear-supabase-users')
  async clearSupabaseUsers() {
    try {
      // Obtener todos los usuarios de Supabase Auth
      const { data: { users }, error } = await this.supabaseService
        .getClient()
        .auth.admin.listUsers();

      if (error) {
        return { success: false, error: error.message };
      }

      // Eliminar cada usuario
      let deleted = 0;
      let errors = 0;
      
      for (const user of users) {
        const { error: deleteError } = await this.supabaseService
          .getClient()
          .auth.admin.deleteUser(user.id);
        
        if (deleteError) {
          console.error(`❌ Error eliminando ${user.email}:`, deleteError.message);
          errors++;
        } else {
          console.log(`✅ Usuario eliminado: ${user.email}`);
          deleted++;
        }
      }

      return { 
        success: true, 
        message: `Usuarios eliminados: ${deleted}, Errores: ${errors}`,
        deleted,
        errors
      };
    } catch (error) {
      return { 
        success: false, 
        message: 'Error eliminando usuarios', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}
