import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ILimitsStorage, LimitCheckResult } from '../interfaces/limits-storage.interface';
import { LimitState } from '../entities/limit-state.entity';
import { OperationLimit } from '../entities/operation-limit.entity';
import { OperationType } from '../entities/operation-type.entity';

// Implementacion de limites en db. TODO implementar en redis.
@Injectable()
export class DbLimitsStorage implements ILimitsStorage {
  constructor(
    @InjectRepository(LimitState)
    private limitStateRepo: Repository<LimitState>,
    @InjectRepository(OperationLimit)
    private operationLimitRepo: Repository<OperationLimit>,
    @InjectRepository(OperationType)
    private operationTypeRepo: Repository<OperationType>
  ) {}

  private async getOrCreateState(userId: number, operationType: string): Promise<LimitState> {
    const type = await this.operationTypeRepo.findOne({ where: { name: operationType } });
    if (!type) {
      throw new Error(`Operation type ${operationType} not found`);
    }

    let state = await this.limitStateRepo.findOne({
      where: { userId, operationType: { id: type.id } },
      relations: ['operationType']
    });

    if (!state) {
      state = this.limitStateRepo.create({
        userId,
        operationType: type,
        dailyAccumulated: 0,
        monthlyAccumulated: 0,
        isBlocked: false,
        blockExpirationDate: new Date()
      });
    }

    return state;
  }

  async checkAndUpdateLimits(userId: number, operationType: string, amount: number, userLevel: number): Promise<LimitCheckResult> {
    const state = await this.getOrCreateState(userId, operationType);
    
    // Si está bloqueado y no expiró, rechazar inmediatamente
    if (state.isBlocked && state.blockExpirationDate > new Date()) {
      return {
        allowed: false,
        reason: 'Operation blocked',
        nextResetDate: state.blockExpirationDate
      };
    }

    // Obtener límites para el nivel del usuario
    const limits = await this.operationLimitRepo.findOne({
      where: {
        operationType: { name: operationType },
        userLevel
      }
    });

    if (!limits) {
      throw new Error(`No limits configured for operation ${operationType} and level ${userLevel}`);
    }

    // Resetear acumulados si es un nuevo día/mes
    const now = new Date();
    const lastOp = state.lastOperation || new Date(0);
    
    if (lastOp.getDate() !== now.getDate() || lastOp.getMonth() !== now.getMonth()) {
      state.dailyAccumulated = 0;
    }
    if (lastOp.getMonth() !== now.getMonth()) {
      state.monthlyAccumulated = 0;
    }

    // Verificar límites
    if (state.dailyAccumulated + amount > limits.dailyLimit) {
      state.isBlocked = true;
      state.blockExpirationDate = new Date(now.setHours(24, 0, 0, 0));
      await this.limitStateRepo.save(state);
      
      return {
        allowed: false,
        reason: 'Daily limit exceeded',
        nextResetDate: state.blockExpirationDate
      };
    }

    if (state.monthlyAccumulated + amount > limits.monthlyLimit) {
      state.isBlocked = true;
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      state.blockExpirationDate = lastDayOfMonth;
      await this.limitStateRepo.save(state);
      
      return {
        allowed: false,
        reason: 'Monthly limit exceeded',
        nextResetDate: state.blockExpirationDate
      };
    }

    // Actualizar acumulados
    state.dailyAccumulated += amount;
    state.monthlyAccumulated += amount;
    state.lastOperation = now;
    state.isBlocked = false;
    await this.limitStateRepo.save(state);

    return { allowed: true };
  }

  async resetLimits(userId: number, operationType: string): Promise<void> {
    const state = await this.getOrCreateState(userId, operationType);
    state.dailyAccumulated = 0;
    state.monthlyAccumulated = 0;
    state.isBlocked = false;
    await this.limitStateRepo.save(state);
  }

  async getLimitsState(userId: number, operationType: string) {
    const state = await this.getOrCreateState(userId, operationType);
    return {
      dailyAccumulated: state.dailyAccumulated,
      monthlyAccumulated: state.monthlyAccumulated,
      isBlocked: state.isBlocked,
      blockExpirationDate: state.blockExpirationDate
    };
  }
}