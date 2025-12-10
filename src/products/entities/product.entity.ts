import { Category } from 'src/categories/entities/category.entity';
import { SaleOrderProduct } from 'src/sale-orders/entities/sale-order-product.entity';
import { ProductImage } from './product-image.entity';
import {
  Column,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'PRODUCTS' })
export class Products {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 50,
    unique: true,
  })
  name: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  description: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
  })
  price: number;

  @Column({
    type: 'int',
    nullable: false,
  })
  stock: number;

  @Column({
    type: 'text',
    default:
      'https://hxjxhchzberrthphpsvo.supabase.co/storage/v1/object/public/products/1765290507434_pngtree-no-image-available-icon-flatvector-illustration-blank-avatar-modern-vector-png-image_40962406.jpg',
  })
  imgUrl: string;

  @DeleteDateColumn()
  deletedAt: Date | null;

  @OneToMany(() => ProductImage, (image) => image.product, { cascade: true })
  images: ProductImage[];
  @ManyToOne(() => Category, (category) => category.products)
  @JoinColumn({ name: 'category_id' })
  category: Category;
  @OneToMany(() => SaleOrderProduct, (item) => item.product)
  saleOrderItems: SaleOrderProduct[];
}
