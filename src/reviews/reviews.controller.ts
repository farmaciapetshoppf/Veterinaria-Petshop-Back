// reviews.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Delete,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { Review } from './entities/reviews.entities';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva reseña' })
  @ApiBody({ type: CreateReviewDto })
  @ApiResponse({
    status: 201,
    description: 'Reseña creada exitosamente',
    type: Review,
  })
  @ApiResponse({ status: 400, description: 'Petición inválida' })
  @ApiResponse({
    status: 404,
    description: 'Veterinario o usuario no encontrado',
  })
  create(@Body() dto: CreateReviewDto) {
    return this.reviewsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las reseñas' })
  @ApiResponse({
    status: 200,
    description: 'Lista de reseñas obtenida correctamente',
    type: [Review],
  })
  findAll() {
    return this.reviewsService.findAll();
  }

  @Get('veterinarian/:id')
  @ApiOperation({ summary: 'Obtener reseñas por veterinario' })
  @ApiParam({
    name: 'id',
    description: 'ID del veterinario',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Reseñas del veterinario obtenidas correctamente',
    type: [Review],
  })
  @ApiResponse({ status: 400, description: 'ID inválido' })
  findByVeterinarian(@Param('id', ParseUUIDPipe) id: string) {
    return this.reviewsService.findByVeterinarian(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una reseña' })
  @ApiParam({
    name: 'id',
    description: 'ID de la reseña',
    type: 'string',
    format: 'uuid',
  })
  @ApiBody({ type: UpdateReviewDto })
  @ApiResponse({
    status: 200,
    description: 'Reseña actualizada correctamente',
    type: Review,
  })
  @ApiResponse({ status: 400, description: 'Petición inválida' })
  @ApiResponse({ status: 404, description: 'Reseña no encontrada' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateReviewDto) {
    return this.reviewsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una reseña' })
  @ApiParam({
    name: 'id',
    description: 'ID de la reseña',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({ status: 200, description: 'Reseña eliminada correctamente' })
  @ApiResponse({ status: 400, description: 'ID inválido' })
  @ApiResponse({ status: 404, description: 'Reseña no encontrada' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.reviewsService.remove(id);
  }
}
