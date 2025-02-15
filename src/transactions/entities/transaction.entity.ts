import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';

export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  TRANSFER_SENT = 'transfer_sent',
  TRANSFER_RECEIVED = 'transfer_received'
}

@Entity()
export class Transaction {
  @ApiProperty({ example: 1, description: 'Unique identifier' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 100.50, description: 'Transaction amount' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @ApiProperty({ example: 'deposit', description: 'Type of transaction', enum: TransactionType})
  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @ApiProperty({ example: 1, description: 'ID of the user who made the transaction' })
  @ManyToOne(() => User)
  user: User;

  @ApiProperty({ example: 2, description: 'ID of the related user (recipient for transfer_sent, sender for transfer_received)', required: false })
  @ManyToOne(() => User, { nullable: true })
  relatedUser: User;

  @ApiProperty({ example: 'Payment for services', description: 'Optional description of the transaction', required: false })
  @Column({ nullable: true })
  description: string;

  @ApiProperty({ example: '2024-02-15T18:00:00Z', description: 'Transaction timestamp' })
  @CreateDateColumn()
  createdAt: Date;
}