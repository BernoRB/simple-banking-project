import { Injectable, NotFoundException } from '@nestjs/common';
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
}