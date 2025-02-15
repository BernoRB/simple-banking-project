import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { DepositDto } from './dto/deposit.dto';
import { Transaction } from './entities/transaction.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TransferDto } from './dto/transfer.dto';

@ApiTags('Transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  // DEPOSITO
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

  // TRANSFERENCIA
  // Swagger
  @ApiOperation({ summary: 'Transfer money', description: 'Transfer money from your account to another user' })
  @ApiResponse({ status: 201, description: 'Transfer successful',
    schema: {
      type: 'object',
      properties: {
        senderTransaction: { type: 'object', $ref: '#/components/schemas/Transaction' },
        recipientTransaction: { type: 'object', $ref: '#/components/schemas/Transaction' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad request - Insufficient funds or invalid recipient' })
  @ApiResponse({ status: 404, description: 'Recipient not found' })
  @ApiBearerAuth()
  // Endpoint
  @UseGuards(JwtAuthGuard)
  @Post('transfer')
  transfer(@Request() req, @Body() transferDto: TransferDto) {
    return this.transactionsService.transfer(
      req.user.userId,
      transferDto.recipientId,
      transferDto.amount,
      transferDto.description
    );
  }
}