import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';

@Entity('license')
export class License {
  @PrimaryGeneratedColumn('increment')
  id: number

  @Column({ unique: true })
  license_key: string

  @Column()
  product_id: string

  @Column()
  issued: string

  @Column()
  expired: string

  @Column({
    type: 'enum',
    enum: ['active', 'inactive', 'expired'],
    default: 'active',
  })
  status: 'active' | 'inactive' | 'expired'

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true
  })
  product_type: string;

  @Column({
    type: 'int',
    default: 0,
    nullable: true
  })
  cpu_core: number;

  @Column({
    type: 'int',
    default: 1,
    nullable: true
  })
  product_cnt: number;

  @Column({
    type: 'enum',
    enum: ['POC', 'BMT', 'TEMP'],
    nullable: true
  })
  business_type: 'POC' | 'BMT' | 'TEMP';

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true
  })
  business_name: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true
  })
  user_type: string;

  @Column({
    type: 'int',
    nullable: true
  })
  company_id: number;

  @CreateDateColumn()
  created: string

  @UpdateDateColumn()
  updated: string

  @DeleteDateColumn()
  removed: string
}