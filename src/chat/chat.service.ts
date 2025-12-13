import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { Users } from '../users/entities/user.entity';
import { Veterinarian } from '../veterinarians/entities/veterinarian.entity';
import { MailerService } from '../mailer/mailer.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
    @InjectRepository(Veterinarian)
    private veterinarianRepository: Repository<Veterinarian>,
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {}

  // Obtener todas las conversaciones de un usuario con detalles de participantes
  async getUserConversations(userId: string): Promise<any[]> {
    const conversations = await this.conversationRepository
      .createQueryBuilder('conversation')
      .where(':userId = ANY(conversation.participants)', { userId })
      .orderBy('conversation.lastMessageAt', 'DESC', 'NULLS LAST')
      .addOrderBy('conversation.createdAt', 'DESC')
      .getMany();

    // Enriquecer con datos de participantes y contador de no leídos
    const enrichedConversations = await Promise.all(
      conversations.map(async (conversation) => {
        // Obtener información de los participantes
        const participantIds = conversation.participants.filter(id => id !== userId);
        const participants = await this.getParticipantsInfo(participantIds);

        // Contar mensajes no leídos
        const unreadCount = await this.messageRepository
          .createQueryBuilder('message')
          .where('message.conversationId = :conversationId', { conversationId: conversation.id })
          .andWhere('message.senderId != :userId', { userId })
          .andWhere('message.isRead = false')
          .getCount();

        return {
          id: conversation.id,
          participants,
          lastMessage: conversation.lastMessage,
          lastMessageAt: conversation.lastMessageAt,
          unreadCount,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
        };
      })
    );

    return enrichedConversations;
  }

  // Método auxiliar para obtener información de participantes
  private async getParticipantsInfo(participantIds: string[]): Promise<Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    profileImageUrl?: string;
  }>> {
    if (participantIds.length === 0) return [];

    const participants: Array<{
      id: string;
      name: string;
      email: string;
      role: string;
      profileImageUrl?: string;
    }> = [];

    for (const id of participantIds) {
      // Buscar en usuarios
      let user = await this.usersRepository.findOne({ where: { id } });
      if (user) {
        participants.push({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role || 'client',
          profileImageUrl: user.profileImageUrl,
        });
        continue;
      }

      // Buscar en veterinarios
      let vet = await this.veterinarianRepository.findOne({ where: { id } });
      if (vet) {
        participants.push({
          id: vet.id,
          name: vet.name,
          email: vet.email,
          role: 'veterinarian',
          profileImageUrl: vet.profileImageUrl,
        });
      }
    }

    return participants;
  }

  // Crear o encontrar conversación entre dos usuarios
  async createOrFindConversation(userId: string, participantId: string): Promise<Conversation> {
    if (userId === participantId) {
      throw new BadRequestException('No puedes crear una conversación contigo mismo');
    }

    // Buscar si ya existe una conversación entre estos usuarios
    const existingConversation = await this.conversationRepository
      .createQueryBuilder('conversation')
      .where(':userId = ANY(conversation.participants)', { userId })
      .andWhere(':participantId = ANY(conversation.participants)', { participantId })
      .getOne();

    if (existingConversation) {
      return existingConversation;
    }

    // Crear nueva conversación
    const newConversation = this.conversationRepository.create({
      participants: [userId, participantId],
    });

    return this.conversationRepository.save(newConversation);
  }

  // Obtener conversación por ID
  async getConversationById(conversationId: string): Promise<Conversation> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversación no encontrada');
    }

    return conversation;
  }

  // Obtener mensajes de una conversación
  async getMessages(conversationId: string, userId: string, limit = 50, offset = 0): Promise<Message[]> {
    // Verificar que el usuario sea parte de la conversación
    const conversation = await this.getConversationById(conversationId);
    if (!conversation.participants.includes(userId)) {
      throw new BadRequestException('No tienes acceso a esta conversación');
    }

    const messages = await this.messageRepository.find({
      where: { conversationId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return messages.reverse(); // Invertir para mostrar más antiguos primero
  }

  // Enviar mensaje
  async sendMessage(data: {
    conversationId: string;
    senderId: string;
    content: string;
    attachments?: string[];
  }): Promise<Message> {
    const conversation = await this.getConversationById(data.conversationId);

    // Verificar que el sender sea parte de la conversación
    if (!conversation.participants.includes(data.senderId)) {
      throw new BadRequestException('No tienes acceso a esta conversación');
    }

    // Crear mensaje
    const message = this.messageRepository.create({
      conversationId: data.conversationId,
      senderId: data.senderId,
      content: data.content,
      attachments: data.attachments || [],
    });

    const savedMessage = await this.messageRepository.save(message);

    // Actualizar conversación con el último mensaje
    conversation.lastMessage = data.content;
    conversation.lastMessageAt = new Date();
    await this.conversationRepository.save(conversation);

    // Enviar notificación por email al destinatario
    try {
      // Obtener información del remitente y destinatario
      const recipientId = conversation.participants.find(id => id !== data.senderId);
      
      if (recipientId) {
        const senderInfo = await this.getParticipantsInfo([data.senderId]);
        const recipientInfo = await this.getParticipantsInfo([recipientId]);

        if (senderInfo.length > 0 && recipientInfo.length > 0) {
          const sender = senderInfo[0];
          const recipient = recipientInfo[0];
          
          // Preparar preview del mensaje (primeros 100 caracteres)
          const messagePreview = data.content.length > 100 
            ? data.content.substring(0, 100) + '...'
            : data.content;

          // URL del frontend para ver la conversación
          const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3002';
          const conversationUrl = `${frontendUrl}/messages/${data.conversationId}`;

          // Enviar email de notificación
          await this.mailerService.sendNewMessageNotification({
            to: recipient.email,
            recipientName: recipient.name,
            senderName: sender.name,
            messagePreview,
            conversationUrl,
          });
        }
      }
    } catch (error) {
      // No lanzar error para no interrumpir el envío del mensaje
      console.error('Error enviando notificación por email:', error);
    }

    return savedMessage;
  }

  // Marcar mensajes como leídos
  async markConversationAsRead(conversationId: string, userId: string): Promise<void> {
    const conversation = await this.getConversationById(conversationId);

    if (!conversation.participants.includes(userId)) {
      throw new BadRequestException('No tienes acceso a esta conversación');
    }

    // Marcar todos los mensajes que no son del usuario como leídos
    await this.messageRepository
      .createQueryBuilder()
      .update(Message)
      .set({ isRead: true })
      .where('conversationId = :conversationId', { conversationId })
      .andWhere('senderId != :userId', { userId })
      .andWhere('isRead = false')
      .execute();
  }

  // Obtener contador de mensajes no leídos
  async getUnreadCount(userId: string): Promise<number> {
    // Obtener todas las conversaciones del usuario (sin enriquecer para performance)
    const conversations = await this.conversationRepository
      .createQueryBuilder('conversation')
      .where(':userId = ANY(conversation.participants)', { userId })
      .getMany();

    const conversationIds = conversations.map((c) => c.id);

    if (conversationIds.length === 0) {
      return 0;
    }

    // Contar mensajes no leídos que no son del usuario
    const count = await this.messageRepository
      .createQueryBuilder('message')
      .where('message.conversationId IN (:...conversationIds)', { conversationIds })
      .andWhere('message.senderId != :userId', { userId })
      .andWhere('message.isRead = false')
      .getCount();

    return count;
  }

  // Obtener contador de no leídos para una conversación específica
  async getUnreadCountForConversation(conversationId: string, userId: string): Promise<number> {
    const count = await this.messageRepository
      .createQueryBuilder('message')
      .where('message.conversationId = :conversationId', { conversationId })
      .andWhere('message.senderId != :userId', { userId })
      .andWhere('message.isRead = false')
      .getCount();

    return count;
  }

  // Marcar un mensaje específico como leído
  async markMessageAsRead(messageId: string): Promise<void> {
    await this.messageRepository.update({ id: messageId }, { isRead: true });
  }

  // Eliminar conversación (soft delete - solo remover al usuario de participants)
  async leaveConversation(conversationId: string, userId: string): Promise<void> {
    const conversation = await this.getConversationById(conversationId);

    if (!conversation.participants.includes(userId)) {
      throw new BadRequestException('No eres parte de esta conversación');
    }

    // Remover usuario de participantes
    conversation.participants = conversation.participants.filter((id) => id !== userId);

    // Si no quedan participantes, eliminar la conversación y sus mensajes
    if (conversation.participants.length === 0) {
      await this.messageRepository.delete({ conversationId });
      await this.conversationRepository.delete({ id: conversationId });
    } else {
      await this.conversationRepository.save(conversation);
    }
  }
}
