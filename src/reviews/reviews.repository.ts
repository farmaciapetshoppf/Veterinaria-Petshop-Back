import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/reviews.entities';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Veterinarian } from 'src/veterinarians/entities/veterinarian.entity';
import { Users } from 'src/users/entities/user.entity';

@Injectable()
export class ReviewsRepository {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(Veterinarian)
    private readonly veterinarianRepository: Repository<Veterinarian>,
    @InjectRepository(Users)
    private readonly userRepository: Repository<Users>,
  ) {}

  async create(dto: CreateReviewDto) {
    const veterinarian = await this.veterinarianRepository.findOne({
      where: { id: dto.veterinarianId },
    });
    if (!veterinarian) {
      throw new NotFoundException('Veterinario no encontrado');
    }

    const user = await this.userRepository.findOne({
      where: { id: dto.userId },
    });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const review = this.reviewRepository.create({
      rating: dto.rating,
      comment: dto.comment,
      veterinarian,
      user,
    });

    return this.reviewRepository.save(review);
  }

  findAll() {
    return this.reviewRepository.find({
      relations: ['veterinarian', 'user'],
    });
  }

  findByVeterinarian(veterinarianId: string) {
    return this.reviewRepository.find({
      where: { veterinarian: { id: veterinarianId } },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, dto: UpdateReviewDto) {
    const review = await this.reviewRepository.findOne({ where: { id } });
    if (!review) throw new NotFoundException('Reseña no encontrada');

    Object.assign(review, dto);

    return this.reviewRepository.save(review);
  }

  async remove(id: string) {
    const review = await this.reviewRepository.findOne({
      where: { id },
      withDeleted: false,
    });
    if (!review) throw new NotFoundException('Reseña no encontrada');

    await this.reviewRepository.softDelete(review);

    return { message: 'Reseña eliminada correctamente' };
  }
}
