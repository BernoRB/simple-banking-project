import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @ApiProperty({ example: 1, description: 'Unique identifier' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'john_doe', description: 'Unique username' })
  @Column({ unique: true })
  username: string;

  @ApiProperty({ description: 'Hashed password', example: '[hidden]' })
  @Exclude()
  @Column()
  password: string;

  @ApiProperty({ example: 'John', description: 'User\'s first name' })
  @Column()
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'User\'s last name' })
  @Column()
  lastName: string;

  @ApiProperty({ example: 'john.doe@example.com', description: 'User\'s email' })
  @Column()
  email: string;

  @ApiProperty({ example: 1000, description: 'Account balance' })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  balance: number;

  @ApiProperty({ example: 1, description: 'User level for transfer limits', minimum: 1 })
  @Column({ default: 1 })
  level: number;

  @ApiProperty({ example: '2024-02-15T18:00:00Z', description: 'Account creation date' })
  @CreateDateColumn()
  createdAt: Date;
}