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
  // Constantes para la lógica de intentos
  private readonly MAX_FAILED_ATTEMPTS = 3;
  private readonly FAILED_ATTEMPTS_WINDOW_HOURS = 24;

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
        operationTypeDescription: type.name,
        dailyAccumulated: 0,
        monthlyAccumulated: 0,
        isBlocked: false,
        failedAttempts: 0
      });
    }

    return state;
  }

  async checkAndUpdateLimits(userId: number, operationType: string, amount: number, userLevel: number): Promise<LimitCheckResult> {
    const state = await this.getOrCreateState(userId, operationType);
    const now = new Date();
    
    // Si está bloqueado y no expiró, rechazar inmediatamente
    if (state.isBlocked && state.blockExpirationDate > now) {
      return {
        allowed: false,
        reason: `Account blocked for exceeding limits repeatedly, try again later.`,
        nextResetDate: state.blockExpirationDate
      };
    }
    
    // Si está bloqueado pero ya expiró, resetear el estado
    if (state.isBlocked && state.blockExpirationDate <= now) {
      state.isBlocked = false;
      state.failedAttempts = 0;
      await this.limitStateRepo.save(state);
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
    const lastOp = state.lastOperation || new Date(0);
    
    if (lastOp.getDate() !== now.getDate() || lastOp.getMonth() !== now.getMonth()) {
      state.dailyAccumulated = 0;
    }
    if (lastOp.getMonth() !== now.getMonth()) {
      state.monthlyAccumulated = 0;
    }

    // Convertir todos los valores a números
    const dailyAccumulated = Number(state.dailyAccumulated);
    const monthlyAccumulated = Number(state.monthlyAccumulated);
    const dailyLimit = Number(limits.dailyLimit);
    const monthlyLimit = Number(limits.monthlyLimit);
    const numericAmount = Number(amount);
    
    // Verificar si la operación excede los límites
    const wouldExceedDailyLimit = dailyAccumulated + numericAmount > dailyLimit;
    const wouldExceedMonthlyLimit = monthlyAccumulated + numericAmount > monthlyLimit;
    
    // Si excede algún límite
    if (wouldExceedDailyLimit || wouldExceedMonthlyLimit) {
      // Resetear contador de intentos fallidos si ha pasado la ventana de tiempo
      if (state.lastFailedAttempt) {
        const hoursElapsed = (now.getTime() - state.lastFailedAttempt.getTime()) / (1000 * 60 * 60);
        if (hoursElapsed > this.FAILED_ATTEMPTS_WINDOW_HOURS) {
          state.failedAttempts = 0;
        }
      }
      
      // Incrementar contador de intentos fallidos
      state.failedAttempts += 1;
      state.lastFailedAttempt = now;
      
      // Si ha excedido el número máximo de intentos, bloquear
      if (state.failedAttempts >= this.MAX_FAILED_ATTEMPTS) {
        state.isBlocked = true;
        // Bloquear hasta el día siguiente a las 00:00
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        state.blockExpirationDate = tomorrow;
        
        await this.limitStateRepo.save(state);
        
        return {
          allowed: false,
          reason: `Account blocked for exceeding limits repeatedly, try again later`,
          nextResetDate: state.blockExpirationDate
        };
      }
      
      // Guardar el estado actualizado con el intento fallido
      await this.limitStateRepo.save(state);
      
      // Rechazar la operación pero sin bloquear (doy lugar a que haya habido un error honesto y no un intento de fraude)
      return {
        allowed: false,
        reason: `Limits exceeded. Try a lower amount.`
      }
    }
    
    // La operación está dentro de los límites
    // Actualizar acumulados
    state.dailyAccumulated = dailyAccumulated + numericAmount;
    state.monthlyAccumulated = monthlyAccumulated + numericAmount;
    state.lastOperation = now;
    await this.limitStateRepo.save(state);
    
    return { allowed: true };
  }

  async resetLimits(userId: number, operationType: string): Promise<void> {
    const state = await this.getOrCreateState(userId, operationType);
    state.dailyAccumulated = 0;
    state.monthlyAccumulated = 0;
    state.isBlocked = false;
    state.failedAttempts = 0;
    await this.limitStateRepo.save(state);
  }

  async getLimitsState(userId: number, operationType: string) {
    const state = await this.getOrCreateState(userId, operationType);
    return {
      dailyAccumulated: Number(state.dailyAccumulated),
      monthlyAccumulated: Number(state.monthlyAccumulated),
      isBlocked: state.isBlocked,
      blockExpirationDate: state.blockExpirationDate,
      failedAttempts: state.failedAttempts,
      lastFailedAttempt: state.lastFailedAttempt
    };
  }
}