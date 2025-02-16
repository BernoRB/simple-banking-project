import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsDateString } from 'class-validator';
import { TransactionType } from '../entities/transaction.entity';
import { Type } from 'class-transformer';

export class TransactionQueryDto {
  @ApiPropertyOptional({ enum: TransactionType, description: 'Filter by transaction type' })
  @IsEnum(TransactionType)
  @IsOptional()
  type?: TransactionType;

  @ApiPropertyOptional({ example: '2024-01-01', description: 'Start date for filtering transactions' })
  @IsDateString()
  @IsOptional()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional({ example: '2024-12-31', description: 'End date for filtering transactions' })
  @IsDateString()
  @IsOptional()
  @Type(() => Date)
  endDate?: Date;
}