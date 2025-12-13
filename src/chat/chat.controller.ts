import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';

@ApiTags('Chat')
@ApiBearerAuth()
@Controller('chat')
@UseGuards(AuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  @ApiOperation({ summary: 'Obtener todas las conversaciones del usuario' })
  @ApiResponse({ status: 200, description: 'Lista de conversaciones' })
  async getConversations(@Request() req) {
    const userId = req.user.id;
    return this.chatService.getUserConversations(userId);
  }

  @Post('conversations')
  @ApiOperation({ summary: 'Crear o encontrar conversación con otro usuario' })
  @ApiResponse({ status: 201, description: 'Conversación creada o encontrada' })
  async createConversation(@Request() req, @Body() dto: CreateConversationDto) {
    const userId = req.user.id;
    return this.chatService.createOrFindConversation(userId, dto.participantId);
  }

  @Get('conversations/unread-count')
  @ApiOperation({ summary: 'Obtener contador de mensajes no leídos' })
  @ApiResponse({ status: 200, description: 'Contador de mensajes no leídos' })
  async getUnreadCount(@Request() req) {
    const userId = req.user.id;
    const count = await this.chatService.getUnreadCount(userId);
    return { count };
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Obtener una conversación específica' })
  @ApiResponse({ status: 200, description: 'Conversación encontrada' })
  async getConversation(@Request() req, @Param('id') conversationId: string) {
    const userId = req.user.id;
    const conversation = await this.chatService.getConversationById(conversationId);
    
    // Verificar que el usuario sea parte de la conversación
    if (!conversation.participants.includes(userId)) {
      throw new BadRequestException('No tienes acceso a esta conversación');
    }

    // Obtener participantes enriquecidos
    const participantIds = conversation.participants.filter(id => id !== userId);
    const participants = await this.chatService['getParticipantsInfo'](participantIds);

    // Contar mensajes no leídos
    const unreadCount = await this.chatService.getUnreadCountForConversation(conversationId, userId);

    return {
      id: conversation.id,
      participants,
      lastMessage: conversation.lastMessage,
      lastMessageAt: conversation.lastMessageAt,
      unreadCount,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
  }

  @Get('conversations/:conversationId/messages')
  @ApiOperation({ summary: 'Obtener mensajes de una conversación' })
  @ApiResponse({ status: 200, description: 'Lista de mensajes' })
  async getMessages(
    @Request() req,
    @Param('conversationId') conversationId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ) {
    const userId = req.user.id;
    const offset = (page - 1) * limit;
    return this.chatService.getMessages(conversationId, userId, limit, offset);
  }

  @Post('conversations/:conversationId/messages')
  @ApiOperation({ summary: 'Enviar mensaje en una conversación' })
  @ApiResponse({ status: 201, description: 'Mensaje enviado' })
  async sendMessage(
    @Request() req,
    @Param('conversationId') conversationId: string,
    @Body() body: { content: string },
  ) {
    const userId = req.user.id;
    return this.chatService.sendMessage({
      conversationId,
      senderId: userId,
      content: body.content,
      attachments: [],
    });
  }

  @Patch('messages/:messageId/read')
  @ApiOperation({ summary: 'Marcar mensaje como leído' })
  @ApiResponse({ status: 200, description: 'Mensaje marcado como leído' })
  async markMessageAsRead(@Request() req, @Param('messageId') messageId: string) {
    await this.chatService.markMessageAsRead(messageId);
    return { success: true };
  }

  @Delete('conversations/:id')
  @ApiOperation({ summary: 'Salir de una conversación' })
  @ApiResponse({ status: 200, description: 'Conversación abandonada' })
  async leaveConversation(@Request() req, @Param('id') conversationId: string) {
    const userId = req.user.id;
    await this.chatService.leaveConversation(conversationId, userId);
    return { success: true };
  }
}
