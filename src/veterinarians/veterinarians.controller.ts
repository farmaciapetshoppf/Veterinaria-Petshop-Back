import {
  Controller,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  Get,
  Patch,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { VeterinariansService } from './veterinarians.service';
import { CreateVeterinarianDto } from './dto/create-veterinarian.dto';
import { ChangePasswordVeterinarianDto } from './dto/change-password-veterinarian.dto';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
  ApiBearerAuth,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateVeterinarianDto } from './dto/update-veterinarian.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/auth/enum/roles.enum';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { CreateControlledMedRequestDto } from './dto/create-controlled-med-request.dto';
import { UpdateMedRequestStatusDto } from './dto/update-med-request-status.dto';

@ApiTags('Veterinarians')
@Controller('veterinarians')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.Admin, Role.User, Role.Veterinarian)
export class VeterinariansController {
  constructor(private readonly veterinariansService: VeterinariansService) {}

  @Get('seeder')
  seeder() {
    return this.veterinariansService.seeder();
  }

  @ApiOperation({
    summary: 'Reset all veterinarians (delete and recreate from seeder)',
  })
  @Post('reset')
  resetAllVeterinarians() {
    return this.veterinariansService.resetAllVeterinarians();
  }

  @ApiOperation({
    summary: 'Reset passwords for all existing veterinarians and send emails',
  })
  @Post('reset-passwords')
  resetPasswordsAndSendEmails() {
    return this.veterinariansService.resetPasswordsAndSendEmails();
  }

  @ApiOperation({
    summary: 'Resend welcome emails with new passwords to all veterinarians',
  })
  @Post('resend-emails')
  resendWelcomeEmails() {
    return this.veterinariansService.resendWelcomeEmails();
  }

  @ApiOperation({
    summary: 'Recreate user in Supabase for a specific veterinarian by email',
  })
  @Post('recreate-supabase/:email')
  recreateSupabaseUser(@Param('email') email: string) {
    return this.veterinariansService.recreateSupabaseUser(email);
  }

  @ApiOperation({ summary: 'Get all active veterinarians' })
  @Get()
  async fillAllVeterinarians() {
    const data = await this.veterinariansService.fillAllVeterinarians();
    return { message: 'Veterinarians retrieved', data };
  }

  @ApiOperation({ summary: 'Get veterinarian by ID' })
  @Get(':id')
  fillByIdVeterinarians(@Param('id', ParseUUIDPipe) id: string) {
    // service returns single veterinarian (password already stripped for GET)
    return this.veterinariansService
      .fillByIdVeterinarians(id)
      .then((data) => ({ message: `Veterinarian ${id} retrieved`, data }));
  }

  @ApiOperation({ summary: 'Create new veterinarian' })
  @Post()
  createVeterinarian(@Body() createVeterinarian: CreateVeterinarianDto) {
    return this.veterinariansService.createVeterinarian(createVeterinarian);
  }

  @ApiOperation({ summary: 'Update veterinarian profile' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        description: {
          type: 'string',
          example: 'Especialista en medicina felina con 5 años de experiencia',
        },
        phone: { type: 'string', example: '+542966777777' },
        profileImage: {
          type: 'string',
          format: 'binary',
          description: 'Imagen de perfil del veterinario (.jpg, .png, .webp)',
        },
      },
    },
  })
  @Patch(':id/profile')
  @UseInterceptors(FileInterceptor('profileImage'))
  updateVeterinarianProfile(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateVeterinarianDto: UpdateVeterinarianDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.veterinariansService.updateVeterinarianProfile(
      id,
      updateVeterinarianDto,
      file,
    );
  }

  @ApiOperation({ summary: 'Deactivate veterinarian' })
  @Patch(':id/deactivate')
  deleteVeterinarian(@Param('id', ParseUUIDPipe) id: string) {
    return this.veterinariansService.deleteVeterinarian(id);
  }

  @ApiOperation({ summary: 'Change veterinarian password' })
  @Patch('change-password')
  changePassword(@Body() body: ChangePasswordVeterinarianDto) {
    return this.veterinariansService.changePassword(body);
  }

  // ============ MEDICAMENTOS CONTROLADOS ============

  @ApiOperation({
    summary: 'Get catalog of controlled medications (Veterinarian only)',
    description:
      'Obtiene el catálogo completo de medicamentos controlados disponibles para solicitar. Incluye anestésicos, opioides, sedantes, etc.',
  })
  @ApiResponse({
    status: 200,
    description: 'Catálogo obtenido exitosamente',
    schema: {
      example: {
        total: 16,
        medications: [
          {
            id: 'ketamina-100',
            nombre: 'Ketamina 100mg/ml',
            categoria: 'Anestésicos',
            descripcion:
              'Anestésico disociativo para procedimientos quirúrgicos',
            presentacion: 'Frasco ampolla 10ml',
            requiereMatricula: true,
            restricciones: 'Lista III - Requiere registro de uso',
          },
        ],
      },
    },
  })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Veterinarian, Role.Admin)
  @ApiBearerAuth()
  @Get('controlled-medications/catalog')
  getControlledMedicationsCatalog() {
    return this.veterinariansService.getControlledMedicationsCatalog();
  }

  @ApiOperation({
    summary: 'Request controlled medication (Veterinarian only)',
    description:
      'Veterinario solicita medicamentos controlados. Se envía notificación por email al administrador.',
  })
  @ApiResponse({
    status: 201,
    description: 'Solicitud creada exitosamente',
    schema: {
      example: {
        message: 'Solicitud de medicamento controlado creada exitosamente',
        request: {
          nombre: 'Ketamina 100mg/ml',
          cantidad: 10,
          urgencia: 'alta',
          justificacion: 'Cirugías programadas',
          fechaSolicitud: '2025-12-14T10:30:00.000Z',
          estado: 'pendiente',
        },
        totalRequests: 3,
      },
    },
  })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Veterinarian)
  @ApiBearerAuth()
  @Post(':id/controlled-medications/request')
  requestControlledMedications(
    @Param('id', ParseUUIDPipe) veterinarianId: string,
    @Body() dto: CreateControlledMedRequestDto,
  ) {
    return this.veterinariansService.requestControlledMedications(
      veterinarianId,
      dto,
    );
  }

  @ApiOperation({
    summary: 'Get my controlled medication requests (Veterinarian only)',
    description:
      'Veterinario consulta sus propias solicitudes de medicamentos controlados',
  })
  @ApiResponse({
    status: 200,
    description: 'Solicitudes obtenidas',
    schema: {
      example: {
        veterinarian: {
          id: 'vet-123',
          name: 'Dr. Juan Pérez',
          email: 'juan@vet.com',
          licenseNumber: 'MP12345',
        },
        requests: [
          {
            nombre: 'Ketamina 100mg/ml',
            cantidad: 10,
            urgencia: 'alta',
            estado: 'aprobado',
            fechaSolicitud: '2025-12-14',
          },
        ],
        total: 3,
      },
    },
  })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Veterinarian)
  @ApiBearerAuth()
  @Get(':id/controlled-medications/my-requests')
  getMyControlledMedRequests(
    @Param('id', ParseUUIDPipe) veterinarianId: string,
  ) {
    return this.veterinariansService.getMyControlledMedRequests(veterinarianId);
  }

  @ApiOperation({
    summary: 'Cancel my controlled medication request (Veterinarian only)',
    description:
      'Veterinario cancela su propia solicitud (solo si está pendiente)',
  })
  @ApiParam({ name: 'id', description: 'ID del veterinario' })
  @ApiParam({
    name: 'requestIndex',
    description: 'Índice de la solicitud en el array',
  })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Veterinarian)
  @ApiBearerAuth()
  @Delete(':id/controlled-medications/my-requests/:requestIndex')
  cancelMyControlledMedRequest(
    @Param('id', ParseUUIDPipe) veterinarianId: string,
    @Param('requestIndex', ParseIntPipe) requestIndex: number,
  ) {
    return this.veterinariansService.cancelMyControlledMedRequest(
      veterinarianId,
      requestIndex,
    );
  }

  @ApiOperation({
    summary: 'Get all controlled medication requests (Admin only)',
    description:
      'Administrador consulta todas las solicitudes de medicamentos controlados de todos los veterinarios',
  })
  @ApiResponse({
    status: 200,
    description: 'Todas las solicitudes obtenidas',
    schema: {
      example: {
        total: 15,
        requests: [
          {
            nombre: 'Ketamina 100mg/ml',
            cantidad: 10,
            urgencia: 'alta',
            estado: 'pendiente',
            veterinarianId: 'vet-123',
            requestIndex: 0,
            veterinarioNombre: 'Dr. Juan Pérez',
            veterinarioEmail: 'juan@vet.com',
            fechaSolicitud: '2025-12-14',
          },
        ],
        pending: 5,
        approved: 8,
        rejected: 2,
      },
    },
  })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @Get('controlled-medications/all-requests')
  getAllControlledMedRequests() {
    return this.veterinariansService.getAllControlledMedRequests();
  }

  @ApiOperation({
    summary: 'Update controlled medication request status (Admin only)',
    description:
      'Administrador aprueba, rechaza o marca como entregado una solicitud de medicamento controlado',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado actualizado exitosamente',
    schema: {
      example: {
        message: 'Estado de solicitud actualizado',
        request: {
          nombre: 'Ketamina 100mg/ml',
          cantidad: 10,
          estado: 'aprobado',
          comentarioAdmin: 'Aprobado - disponible en almacén',
          fechaRespuesta: '2025-12-14T11:00:00.000Z',
        },
      },
    },
  })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @Patch('controlled-medications/update-status')
  updateControlledMedRequestStatus(@Body() dto: UpdateMedRequestStatusDto) {
    return this.veterinariansService.updateControlledMedRequestStatus(dto);
  }
}
