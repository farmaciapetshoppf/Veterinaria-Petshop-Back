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
    veterinarianId: string;
    reason: string;
  }) {
    try {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3002';
      
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
          appointmentsUrl: `${frontendUrl}/appointments`,
          chatUrl: `${frontendUrl}/messages?veterinarianId=${context.veterinarianId}`,
        },
      });
      console.log(`✅ Email de confirmación de turno enviado a ${context.to}`);
      
      // Enviar copia a admin
      await this.sendCopyToAdmin(
        '✅ Turno Confirmado - Huellitas Pet',
        context.to,
        {
          ...context,
          appointmentsUrl: `${frontendUrl}/appointments`,
          chatUrl: `${frontendUrl}/messages?veterinarianId=${context.veterinarianId}`,
        },
        'appointment-confirmation'
      );
    } catch (error) {
      console.error('❌ Error enviando email de confirmación de turno:', error);
      throw error;
    }
  }

  /**
   * Enviar notificación de turno asignado al veterinario
   */
  async sendVeterinarianAppointmentAssigned(context: {
    to: string;
    veterinarianName: string;
    date: string;
    time: string;
    reason: string;
    status: string;
    petName: string;
    ownerName: string;
    ownerPhone: string;
    ownerEmail: string;
    notes?: string;
  }) {
    try {
      await this.nestMailerService.sendMail({
        to: context.to,
        subject: '🩺 Nuevo Turno Asignado - Huellitas Pet',
        template: 'veterinarian-appointment-assigned',
        context,
      });
      console.log(`✅ Email de turno asignado enviado al veterinario ${context.to}`);
      
      // Enviar copia a admin
      await this.sendCopyToAdmin(
        '🩺 Nuevo Turno Asignado - Huellitas Pet',
        context.to,
        context,
        'veterinarian-appointment-assigned'
      );
    } catch (error) {
      console.error('❌ Error enviando email de turno asignado al veterinario:', error);
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
    if (process.env.MAIL_ENABLED !== 'true') return;
    
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

  /**
   * Enviar notificación de mensaje nuevo en chat
   */
  async sendNewMessageNotification(context: {
    to: string;
    recipientName: string;
    senderName: string;
    messagePreview: string;
    conversationUrl: string;
  }) {
    try {
      await this.nestMailerService.sendMail({
        to: context.to,
        subject: '💬 Tienes un mensaje nuevo - Huellitas Pet',
        template: 'new-message',
        context: {
          recipientName: context.recipientName,
          senderName: context.senderName,
          messagePreview: context.messagePreview,
          conversationUrl: context.conversationUrl,
        },
      });
      console.log(`✅ Notificación de mensaje enviada a ${context.to}`);
      
      // Enviar copia a admin
      await this.sendCopyToAdmin(
        '💬 Tienes un mensaje nuevo - Huellitas Pet',
        context.to,
        context,
        'new-message'
      );
    } catch (error) {
      console.error('❌ Error enviando notificación de mensaje:', error);
      throw error;
    }
  }

  /**
   * Enviar solicitud de medicamentos controlados al admin
   */
  async sendControlledMedRequestToAdmin(context: {
    veterinarian: {
      name: string;
      email: string;
      licenseNumber: string;
    };
    medication: string;
    quantity: number;
    urgency: string;
    justification: string;
    requestDate: string;
  }) {
    try {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3002';
      
      await this.nestMailerService.sendMail({
        to: this.adminEmail,
        subject: '🩺 Nueva Solicitud de Medicamento Controlado - Huellitas Pet',
        template: 'controlled-med-request-admin',
        context: {
          veterinarianName: context.veterinarian.name,
          veterinarianEmail: context.veterinarian.email,
          veterinarianLicense: context.veterinarian.licenseNumber,
          medication: context.medication,
          quantity: context.quantity,
          urgency: context.urgency,
          urgencyColor: 
            context.urgency === 'alta' ? '#dc3545' : 
            context.urgency === 'media' ? '#ffc107' : '#28a745',
          justification: context.justification,
          requestDate: context.requestDate,
          adminPanelUrl: `${frontendUrl}/admin/controlled-medications`,
        },
      });
      console.log(`✅ Solicitud de medicamento controlado enviada a admin`);
    } catch (error) {
      console.error('❌ Error enviando solicitud al admin:', error);
      throw error;
    }
  }

  /**
   * Enviar actualización de estado de solicitud al veterinario
   */
  async sendMedRequestStatusUpdate(context: {
    to: string;
    veterinarianName: string;
    medication: string;
    quantity: number;
    status: string;
    comment: string;
  }) {
    try {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3002';
      
      const statusText = {
        aprobado: '✅ APROBADA',
        rechazado: '❌ RECHAZADA',
        entregado: '📦 ENTREGADA',
        cancelado: '🚫 CANCELADA',
      }[context.status] || context.status.toUpperCase();

      const statusColor = {
        aprobado: '#28a745',
        rechazado: '#dc3545',
        entregado: '#17a2b8',
        cancelado: '#6c757d',
      }[context.status] || '#6c757d';

      await this.nestMailerService.sendMail({
        to: context.to,
        subject: `${statusText} - Solicitud de Medicamento Controlado - Huellitas Pet`,
        template: 'controlled-med-status-update',
        context: {
          veterinarianName: context.veterinarianName,
          medication: context.medication,
          quantity: context.quantity,
          status: statusText,
          statusColor: statusColor,
          comment: context.comment,
          myRequestsUrl: `${frontendUrl}/veterinarian/my-requests`,
        },
      });
      console.log(`✅ Actualización de estado enviada a ${context.to}`);
    } catch (error) {
      console.error('❌ Error enviando actualización de estado:', error);
      throw error;
    }
  }

  /**
   * Enviar email de bienvenida a veterinario con contraseña temporal
   */
  async sendVeterinarianWelcome(context: {
    to: string;
    veterinarianName: string;
    temporaryPassword: string;
    loginUrl: string;
  }) {
    try {
      console.log(`📧 Enviando bienvenida a veterinario: ${context.to}`);
      
      await this.nestMailerService.sendMail({
        to: context.to,
        subject: '👨‍⚕️ Bienvenido al equipo - Huellitas Pet',
        template: 'veterinarian-welcome',
        context: {
          to: context.to,
          veterinarianName: context.veterinarianName,
          temporaryPassword: context.temporaryPassword,
          loginUrl: context.loginUrl,
        },
      });
      
      console.log(`✅ Email de bienvenida enviado a ${context.to}`);

      // Enviar copia a admin
      await this.sendCopyToAdmin(
        '👨‍⚕️ Bienvenido al equipo - Huellitas Pet',
        context.to,
        {
          to: context.to,
          veterinarianName: context.veterinarianName,
          temporaryPassword: context.temporaryPassword,
          loginUrl: context.loginUrl,
        },
        'veterinarian-welcome',
      );
    } catch (error) {
      console.error('❌ Error enviando email de bienvenida a veterinario:', error);
      throw error;
    }
  }
}
