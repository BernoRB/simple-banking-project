import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { OperationType } from './operation-type.entity';

@Entity()
export class LimitState {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => OperationType)
  operationType: OperationType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  dailyAccumulated: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monthlyAccumulated: number;

  @CreateDateColumn()
  lastOperation: Date;

  @Column()
  isBlocked: boolean;

  @Column()
  blockExpirationDate: Date;
}