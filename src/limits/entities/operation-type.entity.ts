import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class OperationType {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'TRANSFER' })
  @Column({ unique: true })
  name: string;

  @ApiProperty({ example: 'Money transfers between users' })
  @Column()
  description: string;
}
