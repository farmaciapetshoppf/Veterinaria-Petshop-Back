// reviews.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  UseGuards,
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
import { Roles } from 'src/decorators/roles.decorator';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Role } from 'src/auth/enum/roles.enum';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.User)
  @Post()
  @ApiOperation({ summary: 'Create new review' })
  @ApiBody({ type: CreateReviewDto })
  @ApiResponse({
    status: 201,
    description: 'Review created successfully',
    type: Review,
  })
  @ApiResponse({ status: 400, description: 'Invalid petition' })
  @ApiResponse({
    status: 404,
    description: 'Veterinarian or user not found',
  })
  create(@Body() dto: CreateReviewDto) {
    return this.reviewsService.create(dto);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Veterinarian, Role.Admin, Role.User)
  @Get()
  @ApiOperation({ summary: 'Obtain all reviews' })
  @ApiResponse({
    status: 200,
    description: 'Review list retrieved successfully',
    type: [Review],
  })
  findAll() {
    return this.reviewsService.findAll();
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Veterinarian, Role.Admin, Role.User)
  @Get('veterinarian/:id')
  @ApiOperation({ summary: 'Find review by ID' })
  @ApiParam({
    name: 'id',
    description: 'ID del veterinario',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Reviews retrieved successfully',
    type: [Review],
  })
  @ApiResponse({ status: 400, description: 'Invalid ID' })
  findByVeterinarian(@Param('id', ParseUUIDPipe) id: string) {
    return this.reviewsService.findByVeterinarian(id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.User)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a review' })
  @ApiParam({
    name: 'id',
    description: 'ID de la reseña',
    type: 'string',
    format: 'uuid',
  })
  @ApiBody({ type: UpdateReviewDto })
  @ApiResponse({
    status: 200,
    description: 'Review updated successfully',
    type: Review,
  })
  @ApiResponse({ status: 400, description: 'Invalid petition' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateReviewDto) {
    return this.reviewsService.update(id, dto);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.User)
  @Put(':id')
  @ApiOperation({ summary: 'Soft delete by ID' })
  @ApiParam({
    name: 'id',
    description: 'ID de la reseña',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({ status: 200, description: 'Review deleted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid ID' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.reviewsService.remove(id);
  }
}
