
import {
  Entity,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';
import { SaleOrder } from './sale-order.entity';
import { Products } from 'src/products/entities/product.entity';


@Entity('sale_order_products')
export class SaleOrderProduct {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => SaleOrder, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: SaleOrder;

  @ManyToOne(() => Products, (product) => product.saleOrderItems)
  @JoinColumn({ name: 'product_id' })
  product: Products;

  @Column('int')
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  unitPrice: number;
}