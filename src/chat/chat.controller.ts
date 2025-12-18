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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/auth/enum/roles.enum';

@ApiTags('Chat')
@Controller('chat')
@UseGuards(AuthGuard, RolesGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  @ApiOperation({ summary: 'Obtener todas las conversaciones del usuario' })
  @ApiResponse({ status: 200, description: 'Lista de conversaciones' })
  @ApiBearerAuth()
  @Roles(Role.Admin, Role.Veterinarian, Role.User)
  async getConversations(@Request() req) {
    const userId = req.user.id;
    return this.chatService.getUserConversations(userId);
  }

  @Get('conversations/unread-count')
  @ApiOperation({ summary: 'Obtener contador de mensajes no leídos' })
  @ApiResponse({ status: 200, description: 'Contador de mensajes no leídos' })
  @ApiBearerAuth()
  @Roles(Role.Admin, Role.Veterinarian, Role.User)
  async getUnreadCount(@Request() req) {
    const userId = req.user.id;
    const count = await this.chatService.getUnreadCount(userId);
    return { count };
  }

  @Post('conversations')
  @ApiOperation({ summary: 'Crear o encontrar conversación con otro usuario' })
  @ApiResponse({ status: 201, description: 'Conversación creada o encontrada' })
  @ApiBearerAuth()
  @Roles(Role.Admin, Role.Veterinarian, Role.User)
  async createConversation(@Request() req, @Body() dto: CreateConversationDto) {
    const userId = req.user.id;
    return this.chatService.createOrFindConversation(userId, dto.participantId);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Obtener una conversación específica' })
  @ApiResponse({ status: 200, description: 'Conversación encontrada' })
  @ApiBearerAuth()
  @Roles(Role.Admin, Role.Veterinarian, Role.User)
  async getConversation(@Request() req, @Param('id') conversationId: string) {
    const userId = req.user.id;
    const conversation =
      await this.chatService.getConversationById(conversationId);

    // Verificar que el usuario sea parte de la conversación
    if (!conversation.participants.includes(userId)) {
      throw new BadRequestException('No tienes acceso a esta conversación');
    }

    // Obtener participantes enriquecidos
    const participantIds = conversation.participants.filter(
      (id) => id !== userId,
    );
    const participants =
      await this.chatService['getParticipantsInfo'](participantIds);

    // Contar mensajes no leídos
    const unreadCount = await this.chatService.getUnreadCountForConversation(
      conversationId,
      userId,
    );

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
  @ApiBearerAuth()
  @Roles(Role.Admin, Role.Veterinarian, Role.User)
  async getMessages(
    @Request() req,
    @Param('conversationId') conversationId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ) {
    const userId = req.user.id;
    const offset = (page - 1) * limit;
    return this.chatService.getMessages(
      conversationId,
      userId,
      Number(limit),
      offset,
      Number(page),
    );
  }

  @Post('conversations/:conversationId/messages')
  @ApiOperation({ summary: 'Enviar mensaje en una conversación' })
  @ApiResponse({ status: 201, description: 'Mensaje enviado' })
  @ApiBearerAuth()
  @Roles(Role.Admin, Role.Veterinarian, Role.User)
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

  @Patch('conversations/:conversationId/read')
  @ApiOperation({
    summary: 'Marcar todos los mensajes de una conversación como leídos',
  })
  @ApiResponse({ status: 200, description: 'Mensajes marcados como leídos' })
  @ApiBearerAuth()
  @Roles(Role.Admin, Role.Veterinarian, Role.User)
  async markConversationAsRead(
    @Request() req,
    @Param('conversationId') conversationId: string,
  ) {
    const userId = req.user.id;
    const updatedCount = await this.chatService.markConversationAsRead(
      conversationId,
      userId,
    );
    return {
      message: 'Mensajes marcados como leídos',
      updatedCount,
    };
  }

  @Delete('conversations/:id')
  @ApiOperation({ summary: 'Salir de una conversación' })
  @ApiResponse({ status: 200, description: 'Conversación abandonada' })
  @ApiBearerAuth()
  @Roles(Role.Admin, Role.Veterinarian, Role.User)
  async leaveConversation(@Request() req, @Param('id') conversationId: string) {
    const userId = req.user.id;
    await this.chatService.leaveConversation(conversationId, userId);
    return { success: true };
  }
}
