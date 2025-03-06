import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OperationType } from '../limits/entities/operation-type.entity';

@Injectable()
export class OperationTypesSeed implements OnModuleInit {
  constructor(
    @InjectRepository(OperationType)
    private operationTypeRepository: Repository<OperationType>,
  ) {}

  async onModuleInit() {
    const count = await this.operationTypeRepository.count();
    if (count === 0) {
      // Solo crear si no existen registros
      const operationTypes = [
        { name: 'DEPOSIT', description: 'Money deposit to own account' },
        { name: 'TRANSFER_SENT', description: 'Money sent to another user' },
        { name: 'TRANSFER_RECEIVED', description: 'Money received from another user' }
      ];

      for (const type of operationTypes) {
        const exists = await this.operationTypeRepository.findOne({ 
          where: { name: type.name } 
        });
        
        if (!exists) {
          await this.operationTypeRepository.save(
            this.operationTypeRepository.create(type)
          );
          console.log(`Created operation type: ${type.name}`);
        }
      }
    }
  }
}