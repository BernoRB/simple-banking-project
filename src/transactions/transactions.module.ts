import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { Transaction } from './entities/transaction.entity';
import { User } from '../users/entities/user.entity';
import { LimitsModule } from '../limits/limits.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, User]),
    LimitsModule
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService]
})

export class TransactionsModule {}
