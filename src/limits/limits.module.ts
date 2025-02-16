import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LimitsService } from './limits.service';
import { LimitsController } from './limits.controller';
import { DbLimitsStorage } from './storage/db-limits.storage';
import { OperationType } from './entities/operation-type.entity';
import { OperationLimit } from './entities/operation-limit.entity';
import { LimitState } from './entities/limit-state.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OperationType,
      OperationLimit,
      LimitState
    ])
  ],
  controllers: [LimitsController],
  providers: [
    LimitsService,
    DbLimitsStorage
  ],
  exports: [LimitsService]
})

export class LimitsModule {}
