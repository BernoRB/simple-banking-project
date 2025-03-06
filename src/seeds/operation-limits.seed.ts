import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OperationLimit } from '../limits/entities/operation-limit.entity';
import { OperationType } from '../limits/entities/operation-type.entity';

@Injectable()
export class OperationLimitsSeed implements OnModuleInit {
  constructor(
    @InjectRepository(OperationLimit)
    private operationLimitRepository: Repository<OperationLimit>,
    @InjectRepository(OperationType)
    private operationTypeRepository: Repository<OperationType>,
  ) {}

  async onModuleInit() {
    const count = await this.operationLimitRepository.count();
    if (count === 0) {
      // Configuraciones de límites para diferentes niveles
      const limitsConfig = [
        // Nivel 1
        { operationTypeName: 'DEPOSIT', userLevel: 1, dailyLimit: 10000, monthlyLimit: 50000 },
        { operationTypeName: 'TRANSFER_SENT', userLevel: 1, dailyLimit: 5000, monthlyLimit: 25000 },
        { operationTypeName: 'TRANSFER_RECEIVED', userLevel: 1, dailyLimit: 20000, monthlyLimit: 80000 },
        
        // Nivel 2
        { operationTypeName: 'DEPOSIT', userLevel: 2, dailyLimit: 20000, monthlyLimit: 100000 },
        { operationTypeName: 'TRANSFER_SENT', userLevel: 2, dailyLimit: 10000, monthlyLimit: 50000 },
        { operationTypeName: 'TRANSFER_RECEIVED', userLevel: 2, dailyLimit: 40000, monthlyLimit: 160000 },
        
        // Nivel 3
        { operationTypeName: 'DEPOSIT', userLevel: 3, dailyLimit: 50000, monthlyLimit: 200000 },
        { operationTypeName: 'TRANSFER_SENT', userLevel: 3, dailyLimit: 25000, monthlyLimit: 100000 },
        { operationTypeName: 'TRANSFER_RECEIVED', userLevel: 3, dailyLimit: 100000, monthlyLimit: 400000 },
      ];

      for (const config of limitsConfig) {
        // Obtener el tipo de operación
        const operationType = await this.operationTypeRepository.findOne({
          where: { name: config.operationTypeName }
        });

        if (!operationType) {
          console.log(`Operation type ${config.operationTypeName} not found, skipping limit creation`);
          continue;
        }

        // Verificar si el límite ya existe
        const existingLimit = await this.operationLimitRepository.findOne({
          where: {
            operationType: { id: operationType.id },
            userLevel: config.userLevel
          },
          relations: ['operationType']
        });

        if (!existingLimit) {
          // Crear el límite
          await this.operationLimitRepository.save(
            this.operationLimitRepository.create({
              operationType,
              userLevel: config.userLevel,
              dailyLimit: config.dailyLimit,
              monthlyLimit: config.monthlyLimit
            })
          );
          console.log(`Created operation limit for ${config.operationTypeName}, level ${config.userLevel}`);
        }
      }
    }
  }
}