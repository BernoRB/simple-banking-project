import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TransactionsService } from './transactions.service';
import { Transaction, TransactionType } from './entities/transaction.entity';
import { User } from '../users/entities/user.entity';
import { LimitsService } from '../limits/limits.service';
import { Repository, DataSource } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';

// Mock para el DataSource de TypeORM
const mockDataSource = {
  createQueryRunner: jest.fn().mockReturnValue({
    connect: jest.fn(),
    startTransaction: jest.fn(),
    manager: {
      increment: jest.fn(),
      save: jest.fn(),
    },
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
  }),
};

// Mock para LimitsService
const mockLimitsService = {
  checkOperationLimit: jest.fn(),
};

// Mock para el repositorio de transacciones
const mockTransactionsRepository = {
  create: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
};

// Mock para el repositorio de usuarios
const mockUsersRepository = {
  findOne: jest.fn(),
  increment: jest.fn(),
};

describe('TransactionsService', () => {
  let service: TransactionsService;
  let limitsService: LimitsService;
  let transactionsRepository: Repository<Transaction>;
  let usersRepository: Repository<User>;
  let dataSource: DataSource;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: getRepositoryToken(Transaction),
          useValue: mockTransactionsRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUsersRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: LimitsService,
          useValue: mockLimitsService,
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    limitsService = module.get<LimitsService>(LimitsService);
    transactionsRepository = module.get<Repository<Transaction>>(getRepositoryToken(Transaction));
    usersRepository = module.get<Repository<User>>(getRepositoryToken(User));
    dataSource = module.get<DataSource>(DataSource);

    // Resetear todos los mocks antes de cada test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('deposit', () => {
    it('should successfully deposit amount', async () => {
      // Preparación
      const userId = 1;
      const amount = 100;
      
      // Mock para el usuario
      const mockUser = {
        id: userId,
        balance: 500,
        level: 1,
      };
      
      // Mock para la transacción creada
      const mockTransaction = {
        id: 1,
        amount,
        type: TransactionType.DEPOSIT,
        user: { id: userId },
      };

      // Configurar los mocks - necesitamos hacer un cast para TypeScript
      (usersRepository.findOne as jest.Mock).mockResolvedValue(mockUser);
      (mockLimitsService.checkOperationLimit as jest.Mock).mockResolvedValue({ allowed: true });
      (mockTransactionsRepository.create as jest.Mock).mockReturnValue(mockTransaction);
      const queryRunner = mockDataSource.createQueryRunner();
      (queryRunner.manager.save as jest.Mock).mockResolvedValue(mockTransaction);

      // Ejecución
      const result = await service.deposit(userId, amount);

      // Verificaciones
      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
        select: ['id', 'balance', 'level'],
      });
      expect(mockLimitsService.checkOperationLimit).toHaveBeenCalledWith(
        userId,
        'DEPOSIT',
        amount,
        mockUser.level,
      );
      expect(mockDataSource.createQueryRunner).toHaveBeenCalled();
      expect(queryRunner.connect).toHaveBeenCalled();
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.manager.increment).toHaveBeenCalledWith(
        User,
        { id: userId },
        'balance',
        amount,
      );
      expect(mockTransactionsRepository.create).toHaveBeenCalledWith({
        amount,
        type: TransactionType.DEPOSIT,
        user: { id: userId },
      });
      expect(queryRunner.manager.save).toHaveBeenCalledWith(mockTransaction);
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
      expect(result).toEqual(mockTransaction);
    });

    it('should throw NotFoundException if user not found', async () => {
      // Preparación
      const userId = 999;
      const amount = 100;
      
      // Configurar los mocks
      (usersRepository.findOne as jest.Mock).mockResolvedValue(null);

      // Ejecución y verificación
      await expect(service.deposit(userId, amount)).rejects.toThrow(NotFoundException);
      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
        select: ['id', 'balance', 'level'],
      });
      expect(mockLimitsService.checkOperationLimit).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if deposit exceeds limits', async () => {
      // Preparación
      const userId = 1;
      const amount = 100000;
      
      // Mock para el usuario
      const mockUser = {
        id: userId,
        balance: 500,
        level: 1,
      };
      
      // Configurar los mocks
      (usersRepository.findOne as jest.Mock).mockResolvedValue(mockUser);
      (mockLimitsService.checkOperationLimit as jest.Mock).mockResolvedValue({ 
        allowed: false,
        reason: 'Daily limit exceeded',
      });

      // Ejecución y verificación
      await expect(service.deposit(userId, amount)).rejects.toThrow(BadRequestException);
      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
        select: ['id', 'balance', 'level'],
      });
      expect(mockLimitsService.checkOperationLimit).toHaveBeenCalledWith(
        userId,
        'DEPOSIT',
        amount,
        mockUser.level,
      );
    });
  });
});