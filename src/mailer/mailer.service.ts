import { Injectable } from '@nestjs/common';
import { MailerService as NestMailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailerService {
  private readonly adminEmail = 'abiiibreazuuu@gmail.com';

  constructor(private readonly nestMailerService: NestMailerService) {}

  /**
   * Método auxiliar para enviar copia a admin
   */
  private async sendCopyToAdmin(subject: string, originalTo: string, context: any, template?: string) {
    try {
      await this.nestMailerService.sendMail({
        to: this.adminEmail,
        subject: `[COPIA] ${subject} (Enviado a: ${originalTo})`,
        template: template || 'welcome',
        context: {
          ...context,
          isCopy: true,
          originalRecipient: originalTo,
        },
      });
      console.log(`📧 Copia enviada a admin (${this.adminEmail})`);
    } catch (error) {
      console.error('⚠️  Error enviando copia a admin:', error);
    }
  }

  /**
   * Enviar email de confirmación de turno
   */
  async sendAppointmentConfirmation(context: {
    to: string;
    userName: string;
    appointmentDate: string;
    appointmentTime: string;
    petName: string;
    veterinarianName: string;
    reason: string;
  }) {
    try {
      await this.nestMailerService.sendMail({
        to: context.to,
        subject: '✅ Turno Confirmado - Huellitas Pet',
        template: 'appointment-confirmation',
        context: {
          userName: context.userName,
          appointmentDate: context.appointmentDate,
          appointmentTime: context.appointmentTime,
          petName: context.petName,
          veterinarianName: context.veterinarianName,
          reason: context.reason,
        },
      });
      console.log(`✅ Email de confirmación de turno enviado a ${context.to}`);
      
      // Enviar copia a admin
      await this.sendCopyToAdmin(
        '✅ Turno Confirmado - Huellitas Pet',
        context.to,
        context,
        'appointment-confirmation'
      );
    } catch (error) {
      console.error('❌ Error enviando email de confirmación de turno:', error);
      throw error;
    }
  }

  /**
   * Enviar recordatorio de turno
   */
  async sendAppointmentReminder(context: {
    to: string;
    userName: string;
    appointmentDate: string;
    appointmentTime: string;
    petName: string;
    veterinarianName: string;
    reason: string;
  }) {
    try {
      await this.nestMailerService.sendMail({
        to: context.to,
        subject: '🐾 Recordatorio: Tu turno es mañana',
        template: 'appointment-reminder',
        context: {
          userName: context.userName,
          appointmentDate: context.appointmentDate,
          appointmentTime: context.appointmentTime,
          petName: context.petName,
          veterinarianName: context.veterinarianName,
          reason: context.reason,
        },
      });
      console.log(`✅ Recordatorio de turno enviado a ${context.to}`);
      
      // Enviar copia a admin
      await this.sendCopyToAdmin(
        '🐾 Recordatorio: Tu turno es mañana',
        context.to,
        context,
        'appointment-reminder'
      );
    } catch (error) {
      console.error('❌ Error enviando recordatorio de turno:', error);
      throw error;
    }
  }

  /**
   * Enviar confirmación de compra
   */
  async sendPurchaseConfirmation(context: {
    to: string;
    userName: string;
    orderId: string;
    items: Array<{
      productName: string;
      quantity: number;
      unitPrice: string;
      subtotal: string;
    }>;
    total: string;
  }) {
    try {
      await this.nestMailerService.sendMail({
        to: context.to,
        subject: '✅ Compra Confirmada - Huellitas Pet',
        template: 'purchase-confirmation',
        context: {
          userName: context.userName,
          orderId: context.orderId,
          items: context.items,
          total: context.total,
        },
      });
      console.log(`✅ Email de confirmación de compra enviado a ${context.to}`);
      
      // Enviar copia a admin
      await this.sendCopyToAdmin(
        '✅ Compra Confirmada - Huellitas Pet',
        context.to,
        context,
        'purchase-confirmation'
      );
    } catch (error) {
      console.error('❌ Error enviando email de confirmación de compra:', error);
      throw error;
    }
  }

  /**
   * Método genérico para enviar emails (legacy support)
   */
  async sendMail(to: string, subject: string, html: string) {
    try {
      await this.nestMailerService.sendMail({
        to,
        subject,
        html,
      });
      console.log(`✅ Email enviado a ${to}`);
    } catch (error) {
      console.error('❌ Error enviando email:', error);
      throw error;
    }
  }

  /**
   * Enviar notificación de registro médico
   */
  async sendMedicalRecordNotification(context: {
    to: string;
    ownerName: string;
    petName: string;
    veterinarianName: string;
    diagnosis: string;
    treatment: string;
    medications?: string;
    vaccinations?: string;
    weight?: number;
    temperature?: number;
    nextAppointment?: string;
    observations?: string;
  }) {
    try {
      await this.nestMailerService.sendMail({
        to: context.to,
        subject: '📋 Registro Médico de ' + context.petName,
        template: 'medical-record-notification',
        context,
      });
      console.log(`✅ Notificación de registro médico enviada a ${context.to}`);
      
      // Enviar copia a admin
      await this.sendCopyToAdmin(
        '📋 Registro Médico de ' + context.petName,
        context.to,
        context,
        'medical-record-notification'
      );
    } catch (error) {
      console.error('❌ Error enviando notificación de registro médico:', error);
      throw error;
    }
  }

  /**
   * Enviar email de bienvenida
   */
  async sendWelcomeEmail(context: { to: string; userName: string; temporaryPassword?: string }) {
    try {
      await this.nestMailerService.sendMail({
        to: context.to,
        subject: '🎉 Bienvenido a Huellitas Pet',
        template: 'welcome',
        context,
      });
      console.log(`✅ Email de bienvenida enviado a ${context.to}`);
      
      // Enviar copia a admin
      await this.sendCopyToAdmin(
        '🎉 Bienvenido a Huellitas Pet',
        context.to,
        context,
        'welcome'
      );
    } catch (error) {
      console.error('❌ Error enviando email de bienvenida:', error);
      throw error;
    }
  }

  /**
   * Enviar recordatorio de vacunación
   */
  async sendVaccineReminder(context: {
    to: string;
    ownerName: string;
    petName: string;
    vaccineName: string;
    dueDate: string;
  }) {
    try {
      await this.nestMailerService.sendMail({
        to: context.to,
        subject: '💉 Recordatorio de Vacunación - ' + context.petName,
        template: 'vaccine-reminder',
        context,
      });
      console.log(`✅ Recordatorio de vacuna enviado a ${context.to}`);
      
      // Enviar copia a admin
      await this.sendCopyToAdmin(
        '💉 Recordatorio de Vacunación - ' + context.petName,
        context.to,
        context,
        'vaccine-reminder'
      );
    } catch (error) {
      console.error('❌ Error enviando recordatorio de vacuna:', error);
      throw error;
    }
  }

  /**
   * Enviar felicitación de cumpleaños
   */
  async sendPetBirthdayEmail(context: {
    to: string;
    ownerName: string;
    petName: string;
    age: number;
  }) {
    try {
      await this.nestMailerService.sendMail({
        to: context.to,
        subject: '🎂 Feliz Cumpleaños ' + context.petName + '!',
        template: 'pet-birthday',
        context: {
          ...context,
          moreThanOne: context.age > 1,
        },
      });
      console.log(`✅ Email de cumpleaños enviado a ${context.to}`);
      
      // Enviar copia a admin
      await this.sendCopyToAdmin(
        '🎂 Feliz Cumpleaños ' + context.petName + '!',
        context.to,
        { ...context, moreThanOne: context.age > 1 },
        'pet-birthday'
      );
    } catch (error) {
      console.error('❌ Error enviando email de cumpleaños:', error);
      throw error;
    }
  }

  /**
   * Enviar confirmación de envío
   */
  async sendOrderShipped(context: {
    to: string;
    userName: string;
    orderId: string;
    trackingNumber?: string;
    trackingUrl?: string;
    items: Array<{ productName: string; quantity: number }>;
    shippingAddress: string;
    estimatedDelivery: string;
  }) {
    try {
      await this.nestMailerService.sendMail({
        to: context.to,
        subject: '📦 Tu pedido fue enviado - Huellitas Pet',
        template: 'order-shipped',
        context,
      });
      console.log(`✅ Confirmación de envío enviada a ${context.to}`);
      
      // Enviar copia a admin
      await this.sendCopyToAdmin(
        '📦 Tu pedido fue enviado - Huellitas Pet',
        context.to,
        context,
        'order-shipped'
      );
    } catch (error) {
      console.error('❌ Error enviando confirmación de envío:', error);
      throw error;
    }
  }

  /**
   * Solicitar reseña de producto
   */
  async sendReviewRequest(context: {
    to: string;
    userName: string;
    items: Array<{ productName: string }>;
    reviewUrl: string;
  }) {
    try {
      await this.nestMailerService.sendMail({
        to: context.to,
        subject: '⭐ ¿Qué te pareció tu compra? - Huellitas Pet',
        template: 'review-request',
        context,
      });
      console.log(`✅ Solicitud de reseña enviada a ${context.to}`);
      
      // Enviar copia a admin
      await this.sendCopyToAdmin(
        '⭐ ¿Qué te pareció tu compra? - Huellitas Pet',
        context.to,
        context,
        'review-request'
      );
    } catch (error) {
      console.error('❌ Error enviando solicitud de reseña:', error);
      throw error;
    }
  }

  /**
   * Enviar resumen semanal a veterinarios
   */
  async sendWeeklyScheduleToVet(context: {
    to: string;
    veterinarianName: string;
    weekStart: string;
    weekEnd: string;
    totalAppointments: number;
    daysWithAppointments: number;
    appointments: Array<{
      date: string;
      time: string;
      petName: string;
      reason: string;
    }>;
  }) {
    try {
      await this.nestMailerService.sendMail({
        to: context.to,
        subject: '📅 Tu agenda de la semana - Huellitas Pet',
        template: 'weekly-schedule-vet',
        context,
      });
      console.log(`✅ Resumen semanal enviado a ${context.to}`);
      
      // Enviar copia a admin
      await this.sendCopyToAdmin(
        '📅 Tu agenda de la semana - Huellitas Pet',
        context.to,
        context,
        'weekly-schedule-vet'
      );
    } catch (error) {
      console.error('❌ Error enviando resumen semanal:', error);
      throw error;
    }
  }

  /**
   * Enviar reporte diario a administradores
   */
  async sendAdminDailyReport(context: {
    to: string;
    adminName: string;
    date: string;
    totalAppointments: number;
    lowStockProducts: number;
    newVeterinarians: number;
    appointments: Array<{
      petName: string;
      ownerName: string;
      veterinarianName: string;
      time: string;
      reason: string;
      status: string;
    }>;
    products: Array<{
      name: string;
      stock: number;
      critical: boolean;
    }>;
    veterinarians: Array<{
      name: string;
      email: string;
      phone: string;
      matricula: string;
    }>;
  }) {
    try {
      await this.nestMailerService.sendMail({
        to: context.to,
        subject: '📊 Reporte Diario de Administración - Huellitas Pet',
        template: 'admin-daily-report',
        context,
      });
      console.log(`✅ Reporte diario enviado a ${context.to}`);
      
      // Enviar copia a admin principal si es diferente
      if (context.to !== this.adminEmail) {
        await this.sendCopyToAdmin(
          '📊 Reporte Diario de Administración - Huellitas Pet',
          context.to,
          context,
          'admin-daily-report'
        );
      }
    } catch (error) {
      console.error('❌ Error enviando reporte diario:', error);
      throw error;
    }
  }
}
