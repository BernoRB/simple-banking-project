import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Transaction, TransactionType } from './entities/transaction.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private dataSource: DataSource
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
        select: ['id', 'balance']
      });

      if (!user) {
        throw new NotFoundException('User not found');
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
  async transfer(senderId: number, recipientId: number, amount: number, description?: string): Promise<{
    senderTransaction: Transaction;
    recipientTransaction: Transaction;
  }> {
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
        select: ['id', 'balance']
      });

      if (!sender) {
        throw new NotFoundException('Sender not found');
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
}