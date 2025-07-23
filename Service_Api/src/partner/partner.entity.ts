import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';

@Entity('partner')
export class Partner {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  name: string;

  @Column()
  telnum: string;

  @Column({
    type: 'enum',
    enum: ['PLATINUM', 'GOLD', 'SILVER', 'VAR'],
    default: 'GOLD'
  })
  level: 'PLATINUM' | 'GOLD' | 'SILVER' | 'VAR';

  // @Column({
  //   type: 'tinyint'
  // })
  // deposit_use: boolean;

  // @Column({
  //   type: 'int',
  //   nullable: true
  // })
  // deposit: number;

  // @Column({
  //   type: 'int',
  //   nullable: true
  // })
  // credit: number;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true
  })
  product_category: string;

  @CreateDateColumn()
  created: Date;

  @UpdateDateColumn()
  updated: Date;

  @DeleteDateColumn()
  removed: Date;
}