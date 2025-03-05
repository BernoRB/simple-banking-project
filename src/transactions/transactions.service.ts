import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Transaction, TransactionType } from './entities/transaction.entity';
import { User } from '../users/entities/user.entity';
import { TransactionQueryDto } from './dto/transaction-query.dto';
import { LimitsService } from 'src/limits/limits.service';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private dataSource: DataSource,
    private limitsService: LimitsService
  ) {}

  // DEPOSITO
  async deposit(userId: number, amount: number): Promise<Transaction> {
    // Iniciamos una transacción de base de datos
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Buscamos el usuario y verificamos que exista
      const user = await this.usersRepository.findOne({
        where: { id: userId },
        select: ['id', 'balance', 'level']
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Verificamos limites
      const limitCheck = await this.limitsService.checkOperationLimit(
        userId,
        'DEPOSIT',
        amount,
        user.level
      );
  
      if (!limitCheck.allowed) {
        throw new BadRequestException(
          `${limitCheck.reason}`
        );
      }

      // Actualizamos el balance
      await queryRunner.manager.increment(
        User,
        { id: userId },
        'balance',
        amount
      );

      // Creamos el registro de la transacción
      const transaction = this.transactionsRepository.create({
        amount,
        type: TransactionType.DEPOSIT,
        user: { id: userId }
      });

      await queryRunner.manager.save(transaction);
      
      // Confirmamos la transacción
      await queryRunner.commitTransaction();
      
      return transaction;
    } catch (error) {
      // Si algo falla, revertimos la transacción
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Liberamos el queryRunner
      await queryRunner.release();
    }
  }

  // TRANSFERENCIA
  async transfer(senderId: number, recipientId: number, amount: number, description?: string): Promise<{ senderTransaction: Transaction; recipientTransaction: Transaction; }> {
    if (senderId === recipientId) {
      throw new BadRequestException('Cannot transfer to the same account');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Obtener sender con su balance
      const sender = await this.usersRepository.findOne({
        where: { id: senderId },
        select: ['id', 'balance', 'level']
      });

      if (!sender) {
        throw new NotFoundException('Sender not found');
      }

      // Verificamos limites
      const limitCheck = await this.limitsService.checkOperationLimit(
        senderId,
        'TRANSFER',
        amount,
        sender.level
      );

      if (!limitCheck.allowed) {
        throw new BadRequestException(
          `${limitCheck.reason}`
        );
      }

      // Verificar que el sender tenga suficiente saldo
      if (sender.balance < amount) {
        throw new BadRequestException('Insufficient funds');
      }

      // Obtener recipient
      const recipient = await this.usersRepository.findOne({
        where: { id: recipientId },
        select: ['id', 'balance']
      });

      if (!recipient) {
        throw new NotFoundException('Recipient not found');
      }

      // Restar dinero al sender
      await queryRunner.manager.decrement(
        User,
        { id: senderId },
        'balance',
        amount
      );

      // Agregar dinero al recipient
      await queryRunner.manager.increment(
        User,
        { id: recipientId },
        'balance',
        amount
      );

      // Crear registro de transacción para el sender
      const senderTransaction = this.transactionsRepository.create({
        amount,
        type: TransactionType.TRANSFER_SENT,
        user: { id: senderId },
        relatedUser: { id: recipientId },
        description
      });

      // Crear registro de transacción para el recipient
      const recipientTransaction = this.transactionsRepository.create({
        amount,
        type: TransactionType.TRANSFER_RECEIVED,
        user: { id: recipientId },
        relatedUser: { id: senderId },
        description
      });

      await queryRunner.manager.save([senderTransaction, recipientTransaction]);

      await queryRunner.commitTransaction();

      return { senderTransaction, recipientTransaction };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // HISTORIAL
  async getTransactionHistory(
    userId: number,
    query: TransactionQueryDto
  ) {
    const queryBuilder = this.transactionsRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.relatedUser', 'relatedUser')
      .where('transaction.user.id = :userId', { userId })
      .orderBy('transaction.createdAt', 'DESC');
  
    // Aplicar filtros si existen
    if (query.type) {
      queryBuilder.andWhere('transaction.type = :type', { type: query.type });
    }
  
    if (query.startDate) {
      queryBuilder.andWhere('transaction.createdAt >= :startDate', { 
        startDate: query.startDate 
      });
    }
  
    if (query.endDate) {
      queryBuilder.andWhere('transaction.createdAt <= :endDate', { 
        endDate: query.endDate 
      });
    }
  
    const transactions = await queryBuilder.getMany();
  
    // Transformar los datos para una mejor respuesta
    return transactions.map(transaction => ({
      id: transaction.id,
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
      createdAt: transaction.createdAt,
      relatedUser: transaction.relatedUser ? {
        id: transaction.relatedUser.id,
        username: transaction.relatedUser.username
      } : null
    }));
  }

}
