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
    default:
      'https://hxjxhchzberrthphpsvo.supabase.co/storage/v1/object/public/categories/1765290659268_pngtree-no-image-available-icon-flatvector-illustration-blank-avatar-modern-vector-png-image_40962406.jpg',
  })
  imgUrl: string;

  @DeleteDateColumn()
  deletedAt: Date;

  @OneToMany(() => Products, (products) => products.category)
  products: Products[];
}
