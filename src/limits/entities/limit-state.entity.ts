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

  @Column({ nullable: true })
  operationTypeDescription: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  dailyAccumulated: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monthlyAccumulated: number;

  @CreateDateColumn()
  lastOperation: Date;

  @Column()
  isBlocked: boolean;

  @Column({ nullable: true })
  blockExpirationDate: Date;

  @Column({ default: 0 })
  failedAttempts: number;

  @Column({ nullable: true })
  lastFailedAttempt: Date;
}