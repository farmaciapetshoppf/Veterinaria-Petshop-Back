import { Injectable } from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewsRepository } from './reviews.repository';

@Injectable()
export class ReviewsService {
  constructor(private readonly reviewsRepository: ReviewsRepository) {}

  remove(id: string) {
    return this.reviewsRepository.remove(id);
  }

  update(id: string, dto: UpdateReviewDto) {
    return this.reviewsRepository.update(id, dto);
  }

  findByVeterinarian(id: string) {
    return this.reviewsRepository.findByVeterinarian(id);
  }

  findAll() {
    return this.reviewsRepository.findAll();
  }

  create(dto: CreateReviewDto) {
    return this.reviewsRepository.create(dto);
  }
}
