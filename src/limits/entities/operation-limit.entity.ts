import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { OperationType } from './operation-type.entity';

@Entity()
export class OperationLimit {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => OperationType)
  operationType: OperationType;

  @ApiProperty({ example: 1 })
  @Column()
  userLevel: number;

  @ApiProperty({ example: 10000 })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  dailyLimit: number;

  @ApiProperty({ example: 100000 })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monthlyLimit: number;

  @CreateDateColumn()
  lastUpdated: Date;
}