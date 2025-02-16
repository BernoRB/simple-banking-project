import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive, IsString, Min } from 'class-validator';

export class CreateOperationLimitDto {
  @ApiProperty({ example: 'TRANSFER', description: 'Operation type name' })
  @IsString()
  @IsNotEmpty()
  operationType: string;

  @ApiProperty({ example: 1, description: 'User level for this limit' })
  @IsNumber()
  @Min(1)
  userLevel: number;

  @ApiProperty({ example: 10000, description: 'Maximum amount allowed per day' })
  @IsNumber()
  @IsPositive()
  dailyLimit: number;

  @ApiProperty({ example: 100000, description: 'Maximum amount allowed per month' })
  @IsNumber()
  @IsPositive()
  monthlyLimit: number;
}