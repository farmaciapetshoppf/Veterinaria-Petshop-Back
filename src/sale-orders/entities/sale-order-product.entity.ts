
import { Entity, ManyToOne, JoinColumn, PrimaryGeneratedColumn, Column } from 'typeorm';
// import { SaleOrder } from './sale-order.entity';
// import { SaleOrder } from './sale-order.entity';
import { Products } from 'src/products/entities/product.entity';

@Entity('sale_order_products')
export class SaleOrderProduct {

  @PrimaryGeneratedColumn('uuid')
  id: string;


  // @ManyToOne(() => SaleOrder,{ onDelete: 'CASCADE' })
  // @JoinColumn({ name: 'order_id' })
  // order: SaleOrder;
  // @ManyToOne(() => SaleOrder,{ onDelete: 'CASCADE' })
  // @JoinColumn({ name: 'order_id' })
  // order: SaleOrder;

  @ManyToOne(() => Products, product => product.saleOrderItems)
  @JoinColumn({ name: 'product_id' })
  product: Products;

  @Column('int')
  quantity: number;
}
// @ManyToOne(() => SaleOrder, order => order.items, { onDelete: 'CASCADE' }) la relacion debe quedar asi, borre algunas cosas porque sino rompia por falta de datos