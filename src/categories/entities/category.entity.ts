import { Products } from 'src/products/entities/product.entity';
import {
  Column,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'CATEGORIES' })
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
    unique: true,
  })
  name: string;

  @Column({
    type: 'text',
    default: 'No image',
  })
  imgUrl: string;

  @DeleteDateColumn()
  deletedAt: Date;

  @OneToMany(() => Products, (products) => products.category)
  products: Products[];
}
