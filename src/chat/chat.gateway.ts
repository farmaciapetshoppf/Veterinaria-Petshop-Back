import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: {
    origin: '*', // Ajustar en producción
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, string>(); // userId -> socketId

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.userSockets.set(userId, client.id);
      console.log(`🔌 Usuario ${userId} conectado - Socket: ${client.id}`);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = Array.from(this.userSockets.entries()).find(
      ([_, socketId]) => socketId === client.id,
    )?.[0];
    if (userId) {
      this.userSockets.delete(userId);
      console.log(`🔌 Usuario ${userId} desconectado`);
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; content: string; senderId: string; attachments?: string[] },
  ) {
    try {
      // Guardar mensaje en la base de datos
      const message = await this.chatService.sendMessage({
        conversationId: data.conversationId,
        senderId: data.senderId,
        content: data.content,
        attachments: data.attachments,
      });

      // Obtener participantes de la conversación
      const conversation = await this.chatService.getConversationById(data.conversationId);
      
      // Enviar mensaje a todos los participantes
      conversation.participants.forEach((participantId) => {
        const socketId = this.userSockets.get(participantId);
        if (socketId) {
          this.server.to(socketId).emit('newMessage', message);
        }
      });

      return { success: true, message };
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; userId: string },
  ) {
    try {
      await this.chatService.markConversationAsRead(data.conversationId, data.userId);
      return { success: true };
    } catch (error) {
      console.error('Error al marcar como leído:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; userId: string; isTyping: boolean },
  ) {
    // Obtener participantes y notificar a los demás
    const conversation = await this.chatService.getConversationById(data.conversationId);
    conversation.participants
      .filter((id) => id !== data.userId)
      .forEach((participantId) => {
        const socketId = this.userSockets.get(participantId);
        if (socketId) {
          this.server.to(socketId).emit('userTyping', {
            conversationId: data.conversationId,
            userId: data.userId,
            isTyping: data.isTyping,
          });
        }
      });
  }

  // Método para enviar notificaciones desde el servidor
  sendNotification(userId: string, notification: any) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.server.to(socketId).emit('notification', notification);
    }
  }
}
