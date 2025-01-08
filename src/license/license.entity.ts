import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('license')
export class License {
  @PrimaryGeneratedColumn('increment')
  id: number

  @Column({ unique: true })
  license_key: string

  @Column()
  product_id: string

  @Column()
  issued_date: string

  @Column()
  expiry_date: string

  @Column({
    type: 'enum',
    enum: ['active', 'inactive', 'expired'],
    default: 'active',
  })
  status: 'active' | 'inactive' | 'expired'

  @CreateDateColumn()
  created_at: string

  @UpdateDateColumn()
  updated_at: string
}
