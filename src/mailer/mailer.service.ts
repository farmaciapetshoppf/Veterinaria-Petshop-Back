import { Injectable } from '@nestjs/common';
import { MailerService as NestMailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailerService {
  constructor(private readonly nestMailerService: NestMailerService) {}

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
        template: './appointment-confirmation',
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
        template: './appointment-reminder',
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
        template: './purchase-confirmation',
        context: {
          userName: context.userName,
          orderId: context.orderId,
          items: context.items,
          total: context.total,
        },
      });
      console.log(`✅ Email de confirmación de compra enviado a ${context.to}`);
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
        template: './medical-record-notification',
        context,
      });
      console.log(`✅ Notificación de registro médico enviada a ${context.to}`);
    } catch (error) {
      console.error('❌ Error enviando notificación de registro médico:', error);
      throw error;
    }
  }

  /**
   * Enviar email de bienvenida
   */
  async sendWelcomeEmail(context: { to: string; userName: string }) {
    try {
      await this.nestMailerService.sendMail({
        to: context.to,
        subject: '🎉 Bienvenido a Huellitas Pet',
        template: './welcome',
        context,
      });
      console.log(`✅ Email de bienvenida enviado a ${context.to}`);
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
        template: './vaccine-reminder',
        context,
      });
      console.log(`✅ Recordatorio de vacuna enviado a ${context.to}`);
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
        template: './pet-birthday',
        context: {
          ...context,
          moreThanOne: context.age > 1,
        },
      });
      console.log(`✅ Email de cumpleaños enviado a ${context.to}`);
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
        template: './order-shipped',
        context,
      });
      console.log(`✅ Confirmación de envío enviada a ${context.to}`);
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
        template: './review-request',
        context,
      });
      console.log(`✅ Solicitud de reseña enviada a ${context.to}`);
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
        template: './weekly-schedule-vet',
        context,
      });
      console.log(`✅ Resumen semanal enviado a ${context.to}`);
    } catch (error) {
      console.error('❌ Error enviando resumen semanal:', error);
      throw error;
    }
  }
}
