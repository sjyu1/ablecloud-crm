import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';

@Entity('business')
export class Business {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    default: ''
  })
  name: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
    default: ''
  })
  issued: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
    default: ''
  })
  expired: string;

  @Column({
    type: 'text',
    nullable: false,
    default: ''
  })
  history: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    default: ''
  })
  license_id: string;

  @Column({
    type: 'int',
    nullable: false,
    default: ''
  })
  customer_id: number;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    default: ''
  })
  status: string;

  @Column({
    type: 'int',
    nullable: false,
    default: ''
  })
  core_cnt: number;

  @Column({
    type: 'int',
    nullable: false,
    default: ''
  })
  node_cnt: number;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    default: ''
  })
  manager_id: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true
  })
  product_type: string;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: false
  })
  created: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
    nullable: false
  })
  updated: Date;

  @DeleteDateColumn({
    type: 'timestamp',
    nullable: true
  })
  removed: Date | null;
}