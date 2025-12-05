import { Column, CreateDateColumn, Entity, JoinColumn, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ManyToOne } from "typeorm";
import { Users } from "src/users/entities/user.entity";
import { Branch } from 'src/branches/entities/branch.entity';
import { SaleOrderProduct } from './sale-order-product.entity';
export enum SaleOrderStatus {
  ACTIVE = 'ACTIVE',       // Carrito activo - stock ya descontado
  PENDING = 'PENDING',     // Esperando confirmación de pago en Mercado Pago
  PAID = 'PAID',           // Pagado y finalizado
  CANCELLED = 'CANCELLED', // Cancelado - stock restaurado
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
    default: SaleOrderStatus.ACTIVE,  // Por defecto inicia como carrito activo
  })
  status: SaleOrderStatus;

  @Column({ type: 'varchar', length: 50, nullable: true })
  paymentMethod?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  // Fecha de expiración del carrito (24hs desde creación)
  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  // ID de preferencia/pago en Mercado Pago
  @Column({ type: 'varchar', nullable: true })
  mercadoPagoId?: string;

  // Estado del pago según Mercado Pago
  @Column({ type: 'varchar', nullable: true })
  mercadoPagoStatus?: string;

    // Buyer: el cliente que realiza la compra
    @ManyToOne(() => Users, (user) => user.buyerSaleOrders)
    buyer: Users;

    // Opcional: sucursal donde se procesa la orden (si se usa multi-sucursal)
    @ManyToOne(() => Branch, { nullable: true })
    @JoinColumn({ name: 'branch_id' })
    branch?: Branch;






}

