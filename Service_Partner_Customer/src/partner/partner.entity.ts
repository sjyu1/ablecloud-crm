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
    enum: ['PLATINUM', 'GOLD', 'VAD'],
    default: 'GOLD'
  })
  level: 'PLATINUM' | 'GOLD' | 'VAD';

  @CreateDateColumn()
  created: Date;

  @UpdateDateColumn()
  updated: Date;

  @DeleteDateColumn()
  removed: Date;
}