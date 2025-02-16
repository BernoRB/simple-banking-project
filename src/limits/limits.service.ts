import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OperationType } from './entities/operation-type.entity';
import { OperationLimit } from './entities/operation-limit.entity';
import { CreateOperationTypeDto } from './dto/create-operation-type.dto';
import { CreateOperationLimitDto } from './dto/create-operation-limit.dto';
import { DbLimitsStorage } from './storage/db-limits.storage';

@Injectable()
export class LimitsService {
  constructor(
    @InjectRepository(OperationType)
    private operationTypeRepo: Repository<OperationType>,
    @InjectRepository(OperationLimit)
    private operationLimitRepo: Repository<OperationLimit>,
    private limitsStorage: DbLimitsStorage,
  ) {}

  async createOperationType(createOperationTypeDto: CreateOperationTypeDto) {
    const existing = await this.operationTypeRepo.findOne({
      where: { name: createOperationTypeDto.name }
    });

    if (existing) {
      throw new ConflictException(`Operation type ${createOperationTypeDto.name} already exists`);
    }

    const operationType = this.operationTypeRepo.create(createOperationTypeDto);
    return this.operationTypeRepo.save(operationType);
  }

  async findAllOperationTypes() {
    return this.operationTypeRepo.find();
  }

  async createOperationLimit(createOperationLimitDto: CreateOperationLimitDto) {
    const operationType = await this.operationTypeRepo.findOne({
      where: { name: createOperationLimitDto.operationType }
    });

    if (!operationType) {
      throw new NotFoundException(`Operation type ${createOperationLimitDto.operationType} not found`);
    }

    const existing = await this.operationLimitRepo.findOne({
      where: {
        operationType: { id: operationType.id },
        userLevel: createOperationLimitDto.userLevel
      }
    });

    if (existing) {
      throw new ConflictException(
        `Limit for operation ${createOperationLimitDto.operationType} and level ${createOperationLimitDto.userLevel} already exists`
      );
    }

    const operationLimit = this.operationLimitRepo.create({
      ...createOperationLimitDto,
      operationType
    });

    return this.operationLimitRepo.save(operationLimit);
  }

  async findAllOperationLimits() {
    return this.operationLimitRepo.find({
      relations: ['operationType']
    });
  }


  // Verificar limites
  async checkOperationLimit(
    userId: number,
    operationType: string,
    amount: number,
    userLevel: number
  ) {
    return this.limitsStorage.checkAndUpdateLimits(
      userId,
      operationType,
      amount,
      userLevel
    );
  }
}