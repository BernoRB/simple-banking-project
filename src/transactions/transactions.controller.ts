import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { DepositDto } from './dto/deposit.dto';
import { Transaction } from './entities/transaction.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  // Swagger
  @ApiOperation({ summary: 'Make a deposit', description: 'Deposit money into your own account'})
  @ApiResponse({ status: 201, description: 'Deposit successful',type: Transaction })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBearerAuth()
  // Endpoint
  @UseGuards(JwtAuthGuard)
  @Post('deposit')
  deposit(@Request() req, @Body() depositDto: DepositDto) {
    return this.transactionsService.deposit(req.user.userId, depositDto.amount);
  }
}