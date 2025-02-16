import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateOperationTypeDto {
  @ApiProperty({ example: 'TRANSFER', description: 'Name of the operation type' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Money transfers between users', description: 'Description of the operation type' })
  @IsString()
  @IsNotEmpty()
  description: string;
}
