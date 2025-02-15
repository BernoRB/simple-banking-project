import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive } from 'class-validator';

export class DepositDto {
  @ApiProperty({
    example: 100.50,
    description: 'Amount to deposit in the account',
    minimum: 0.01
  })
  @IsNumber()
  @IsPositive()
  amount: number;
}