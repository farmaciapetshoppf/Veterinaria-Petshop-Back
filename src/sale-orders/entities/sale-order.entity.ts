import { Column, CreateDateColumn, Entity, JoinColumn, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ManyToOne } from "typeorm";
import { Users } from "src/users/entities/user.entity";
import { Branch } from 'src/branches/entities/branch.entity';
import { SaleOrderProduct } from './sale-order-product.entity';
export enum SaleOrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

@Entity('sale_orders')
export class SaleOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToMany(() => SaleOrderProduct, (item) => item.order, { cascade: true })
  items: SaleOrderProduct[];

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  total: number;

  @Column({
    type: 'enum',
    enum: SaleOrderStatus,
    default: SaleOrderStatus.PENDING,
  })
  status: SaleOrderStatus;

  @Column({ type: 'varchar', length: 50, nullable: true })
  paymentMethod?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

    // Buyer: el cliente que realiza la compra
    @ManyToOne(() => Users, (user) => user.buyerSaleOrders)
    buyer: Users;

    // Opcional: sucursal donde se procesa la orden (si se usa multi-sucursal)
    @ManyToOne(() => Branch, { nullable: true })
    @JoinColumn({ name: 'branch_id' })
    branch?: Branch;






}

