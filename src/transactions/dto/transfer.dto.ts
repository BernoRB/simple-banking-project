import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class TransferDto {
  @ApiProperty({ example: 100.50, description: 'Amount to transfer', minimum: 0.01 })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({ example: 2, description: 'ID of the recipient user' })
  @IsNumber()
  @IsNotEmpty()
  recipientId: number;

  @ApiProperty({ example: 'Payment for dinner', description: 'Description of the transfer', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}