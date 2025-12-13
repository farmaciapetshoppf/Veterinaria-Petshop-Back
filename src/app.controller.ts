import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { MailerService } from './mailer/mailer.service';
import { SupabaseService } from './supabase/supabase.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly mailerService: MailerService,
    private readonly supabaseService: SupabaseService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
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
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!serviceRoleKey) {
        return { 
          success: false, 
          message: 'SUPABASE_SERVICE_ROLE_KEY no está configurada en .env' 
        };
      }

      // Crear cliente admin con service role key
      const { createClient } = require('@supabase/supabase-js');
      const supabaseUrl = process.env.SUPABASE_URL;
      const adminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });

      // Obtener todos los usuarios
      const { data: { users }, error } = await adminClient.auth.admin.listUsers();

      if (error) {
        return { success: false, error: error.message };
      }

      // Eliminar cada usuario
      let deleted = 0;
      let errors = 0;
      const results: Array<{ email: string; success: boolean; error?: string }> = [];
      
      for (const user of users) {
        const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
        
        if (deleteError) {
          console.error(`❌ Error eliminando ${user.email}:`, deleteError.message);
          errors++;
          results.push({ email: user.email, success: false, error: deleteError.message });
        } else {
          console.log(`✅ Usuario eliminado: ${user.email}`);
          deleted++;
          results.push({ email: user.email, success: true });
        }
      }

      return { 
        success: true, 
        message: `Usuarios eliminados: ${deleted}, Errores: ${errors}`,
        deleted,
        errors,
        details: results
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
