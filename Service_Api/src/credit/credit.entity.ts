import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';

@Entity('credit')
export class Credit {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({
    type: 'int',
    nullable: true
  })
  partner_id: string;

  @Column({
    type: 'int',
    nullable: true
  })
  business_id: number;

  @Column({
    type: 'int',
    nullable: true
  })
  deposit: number;

  @Column({
    type: 'int',
    nullable: true
  })
  credit: number;

  @Column({
    type: 'text',
    nullable: true
  })
  note: string;

  @CreateDateColumn()
  created: Date;

  @UpdateDateColumn()
  updated: Date;

  @DeleteDateColumn()
  removed: Date;
}