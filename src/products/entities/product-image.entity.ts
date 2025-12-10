import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Products } from './product.entity';

@Entity({ name: 'PRODUCT_IMAGES' })
export class ProductImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'text',
    nullable: false,
  })
  imageUrl: string;

  @Column({
    type: 'int',
    default: 0,
  })
  order: number;

  @ManyToOne(() => Products, (product) => product.images, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Products;
}
