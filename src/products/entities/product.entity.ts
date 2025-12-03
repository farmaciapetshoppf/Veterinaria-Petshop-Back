import { Category } from 'src/categories/entities/category.entity';
import { SaleOrderProduct } from 'src/sale-orders/entities/sale-order-product.entity';
import {
  Column,
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
    default: 'No image',
  })
  imgUrl: string;

  @ManyToOne(() => Category, (category) => category.products)
  @JoinColumn({ name: 'category_id' })
  category: Category;
  @OneToMany(() => SaleOrderProduct, (item) => item.product)
  saleOrderItems: SaleOrderProduct[];
}
