import { forwardRef, Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from './entities/reviews.entities';
import { Veterinarian } from 'src/veterinarians/entities/veterinarian.entity';
import { Users } from 'src/users/entities/user.entity';
import { ReviewsRepository } from './reviews.repository';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { VeterinariansModule } from 'src/veterinarians/veterinarians.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Review, Veterinarian, Users]),
    forwardRef(() => AuthModule),
    forwardRef(() => VeterinariansModule),
    forwardRef(() => UsersModule),
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService, ReviewsRepository],
  exports: [ReviewsRepository],
})
export class ReviewsModule {}
