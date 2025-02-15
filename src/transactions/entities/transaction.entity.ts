import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';

export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  TRANSFER = 'transfer'
}

@Entity()
export class Transaction {
  @ApiProperty({ example: 1, description: 'Unique identifier' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 100.50, description: 'Transaction amount' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @ApiProperty({ example: 'deposit', description: 'Type of transaction',enum: TransactionType})
  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @ApiProperty({ example: 1, description: 'ID of the user who made the transaction' })
  @ManyToOne(() => User)
  user: User;

  @ApiProperty({ example: '2024-02-15T18:00:00Z', description: 'Transaction timestamp' })
  @CreateDateColumn()
  createdAt: Date;
}