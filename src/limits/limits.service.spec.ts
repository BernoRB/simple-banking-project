import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LimitsService } from './limits.service';
import { OperationType } from './entities/operation-type.entity';
import { OperationLimit } from './entities/operation-limit.entity';
import { DbLimitsStorage } from './storage/db-limits.storage';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

const mockOperationTypeRepo = {
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const mockOperationLimitRepo = {
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const mockDbLimitsStorage = {
  checkAndUpdateLimits: jest.fn(),
  resetLimits: jest.fn(),
  getLimitsState: jest.fn(),
};

describe('LimitsService', () => {
  let service: LimitsService;
  let operationTypeRepo: Repository<OperationType>;
  let operationLimitRepo: Repository<OperationLimit>;
  let dbLimitsStorage: DbLimitsStorage;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LimitsService,
        {
          provide: getRepositoryToken(OperationType),
          useValue: mockOperationTypeRepo,
        },
        {
          provide: getRepositoryToken(OperationLimit),
          useValue: mockOperationLimitRepo,
        },
        {
          provide: DbLimitsStorage,
          useValue: mockDbLimitsStorage,
        },
      ],
    }).compile();

    service = module.get<LimitsService>(LimitsService);
    operationTypeRepo = module.get<Repository<OperationType>>(
      getRepositoryToken(OperationType),
    );
    operationLimitRepo = module.get<Repository<OperationLimit>>(
      getRepositoryToken(OperationLimit),
    );
    dbLimitsStorage = module.get<DbLimitsStorage>(DbLimitsStorage);

    // Resetear todos los mocks antes de cada test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOperationType', () => {
    it('should create a new operation type', async () => {
      // Preparación
      const createDto = {
        name: 'TRANSFER',
        description: 'Money transfers between users',
      };
      
      const mockSavedType = {
        id: 1,
        ...createDto,
      };

      // Configurar mocks
      mockOperationTypeRepo.findOne.mockResolvedValue(null);
      mockOperationTypeRepo.create.mockReturnValue(createDto);
      mockOperationTypeRepo.save.mockResolvedValue(mockSavedType);

      // Ejecución
      const result = await service.createOperationType(createDto);

      // Verificaciones
      expect(mockOperationTypeRepo.findOne).toHaveBeenCalledWith({
        where: { name: createDto.name }
      });
      expect(mockOperationTypeRepo.create).toHaveBeenCalledWith(createDto);
      expect(mockOperationTypeRepo.save).toHaveBeenCalled();
      expect(result).toEqual(mockSavedType);
    });

    it('should throw ConflictException if operation type already exists', async () => {
      // Preparación
      const createDto = {
        name: 'TRANSFER',
        description: 'Money transfers between users',
      };
      
      const existingType = {
        id: 1,
        ...createDto,
      };

      // Configurar mocks
      mockOperationTypeRepo.findOne.mockResolvedValue(existingType);

      // Ejecución y verificación
      await expect(service.createOperationType(createDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockOperationTypeRepo.findOne).toHaveBeenCalledWith({
        where: { name: createDto.name }
      });
      expect(mockOperationTypeRepo.create).not.toHaveBeenCalled();
      expect(mockOperationTypeRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('createOperationLimit', () => {
    it('should create a new operation limit', async () => {
      // Preparación
      const createDto = {
        operationType: 'TRANSFER',
        userLevel: 1,
        dailyLimit: 10000,
        monthlyLimit: 50000,
      };
      
      const mockOperationType = {
        id: 1,
        name: 'TRANSFER',
        description: 'Money transfers between users',
      };

      const mockSavedLimit = {
        id: 1,
        operationType: mockOperationType,
        userLevel: createDto.userLevel,
        dailyLimit: createDto.dailyLimit,
        monthlyLimit: createDto.monthlyLimit,
      };

      // Configurar mocks
      mockOperationTypeRepo.findOne.mockResolvedValue(mockOperationType);
      mockOperationLimitRepo.findOne.mockResolvedValue(null);
      mockOperationLimitRepo.create.mockReturnValue({
        ...createDto,
        operationType: mockOperationType,
      });
      mockOperationLimitRepo.save.mockResolvedValue(mockSavedLimit);

      // Ejecución
      const result = await service.createOperationLimit(createDto);

      // Verificaciones
      expect(mockOperationTypeRepo.findOne).toHaveBeenCalledWith({
        where: { name: createDto.operationType }
      });
      expect(mockOperationLimitRepo.findOne).toHaveBeenCalledWith({
        where: {
          operationType: { id: mockOperationType.id },
          userLevel: createDto.userLevel
        }
      });
      expect(mockOperationLimitRepo.create).toHaveBeenCalledWith({
        ...createDto,
        operationType: mockOperationType,
      });
      expect(mockOperationLimitRepo.save).toHaveBeenCalled();
      expect(result).toEqual(mockSavedLimit);
    });

    it('should throw NotFoundException if operation type not found', async () => {
      // Preparación
      const createDto = {
        operationType: 'NONEXISTENT',
        userLevel: 1,
        dailyLimit: 10000,
        monthlyLimit: 50000,
      };

      // Configurar mocks
      mockOperationTypeRepo.findOne.mockResolvedValue(null);

      // Ejecución y verificación
      await expect(service.createOperationLimit(createDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockOperationTypeRepo.findOne).toHaveBeenCalledWith({
        where: { name: createDto.operationType }
      });
      expect(mockOperationLimitRepo.findOne).not.toHaveBeenCalled();
      expect(mockOperationLimitRepo.create).not.toHaveBeenCalled();
      expect(mockOperationLimitRepo.save).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if limit already exists for operation type and level', async () => {
      // Preparación
      const createDto = {
        operationType: 'TRANSFER',
        userLevel: 1,
        dailyLimit: 10000,
        monthlyLimit: 50000,
      };
      
      const mockOperationType = {
        id: 1,
        name: 'TRANSFER',
        description: 'Money transfers between users',
      };

      const existingLimit = {
        id: 1,
        operationType: mockOperationType,
        userLevel: createDto.userLevel,
        dailyLimit: 5000,
        monthlyLimit: 20000,
      };

      // Configurar mocks
      mockOperationTypeRepo.findOne.mockResolvedValue(mockOperationType);
      mockOperationLimitRepo.findOne.mockResolvedValue(existingLimit);

      // Ejecución y verificación
      await expect(service.createOperationLimit(createDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockOperationTypeRepo.findOne).toHaveBeenCalledWith({
        where: { name: createDto.operationType }
      });
      expect(mockOperationLimitRepo.findOne).toHaveBeenCalledWith({
        where: {
          operationType: { id: mockOperationType.id },
          userLevel: createDto.userLevel
        }
      });
      expect(mockOperationLimitRepo.create).not.toHaveBeenCalled();
      expect(mockOperationLimitRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('checkOperationLimit', () => {
    it('should check operation limits through DbLimitsStorage', async () => {
      // Preparación
      const userId = 1;
      const operationType = 'TRANSFER';
      const amount = 500;
      const userLevel = 1;
      
      const mockResult = { allowed: true };

      // Configurar mocks
      mockDbLimitsStorage.checkAndUpdateLimits.mockResolvedValue(mockResult);

      // Ejecución
      const result = await service.checkOperationLimit(
        userId,
        operationType,
        amount,
        userLevel,
      );

      // Verificaciones
      expect(mockDbLimitsStorage.checkAndUpdateLimits).toHaveBeenCalledWith(
        userId,
        operationType,
        amount,
        userLevel,
      );
      expect(result).toEqual(mockResult);
    });
  });
});