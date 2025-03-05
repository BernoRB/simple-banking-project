import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Mock para bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

// Mock para el repositorio de usuarios
const mockUsersRepository = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUsersRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    usersRepository = module.get<Repository<User>>(getRepositoryToken(User));

    // Resetear todos los mocks antes de cada test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create a user', async () => {
      // Preparación
      const createUserDto = {
        username: 'testuser',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        balance: 0
      };
    
      const hashedPassword = 'hashedpassword123';
      
      const userToCreate = {
        ...createUserDto,
        password: hashedPassword,
      };
      
      const savedUser = {
        id: 1,
        ...userToCreate,
        balance: 0,
        level: 1,
        createdAt: new Date(),
      };
    
      // Configurar mocks
      (mockUsersRepository.findOne as jest.Mock).mockResolvedValue(null); // No existe el usuario
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      (mockUsersRepository.create as jest.Mock).mockReturnValue(userToCreate);
      (mockUsersRepository.save as jest.Mock).mockResolvedValue(savedUser);
    
      // Ejecución
      const result = await service.create(createUserDto);
    
      // Verificaciones
      expect(mockUsersRepository.findOne).toHaveBeenCalledWith({
        where: [
          { username: createUserDto.username },
          { email: createUserDto.email }
        ],
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(mockUsersRepository.create).toHaveBeenCalledWith({
        ...createUserDto,
        password: hashedPassword,
      });
      expect(mockUsersRepository.save).toHaveBeenCalledWith(userToCreate);
      expect(result).toEqual(savedUser);
    });

    it('should throw ConflictException if username already exists', async () => {
      // Preparación
      const createUserDto = {
        username: 'existinguser',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
      };
    
      const existingUser = {
        id: 1,
        ...createUserDto,
        password: 'hashedpassword',
        balance: 0,
        level: 1,
        createdAt: new Date(),
      };
    
      // Configurar mocks - comprobar cómo se llama realmente a findOne
      (mockUsersRepository.findOne as jest.Mock).mockResolvedValue(existingUser);
    
      // Ejecución y verificación
      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
      
      // Actualizar la expectativa para que coincida con la implementación real
      expect(mockUsersRepository.findOne).toHaveBeenCalledWith({
        where: [
          { username: createUserDto.username },
          { email: createUserDto.email }
        ],
      });
      
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(mockUsersRepository.create).not.toHaveBeenCalled();
      expect(mockUsersRepository.save).not.toHaveBeenCalled();
    });

  });

  describe('findOne', () => {
    it('should return a user if found', async () => {
      // Preparación
      const userId = 1;
      const mockUser = {
        id: userId,
        username: 'testuser',
        password: 'hashedpassword',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        balance: 500,
        level: 1,
        createdAt: new Date(),
      };

      // Configurar mocks
      mockUsersRepository.findOne.mockResolvedValue(mockUser);

      // Ejecución
      const result = await service.findOne(userId);

      // Verificaciones
      expect(mockUsersRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found by username', async () => {
      // Preparación
      const username = 'nonexistentuser';
    
      // Configurar mocks
      (mockUsersRepository.findOne as jest.Mock).mockResolvedValue(null);
    
      // Ejecución y verificación
      await expect(service.findByUsername(username)).rejects.toThrow(NotFoundException);
      expect(mockUsersRepository.findOne).toHaveBeenCalledWith({
        where: { username },
      });
    });
  });

  describe('findByUsername', () => {
    it('should return a user if found by username', async () => {
      // Preparación
      const username = 'testuser';
      const mockUser = {
        id: 1,
        username,
        password: 'hashedpassword',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        balance: 500,
        level: 1,
        createdAt: new Date(),
      };

      // Configurar mocks
      mockUsersRepository.findOne.mockResolvedValue(mockUser);

      // Ejecución
      const result = await service.findByUsername(username);

      // Verificaciones
      expect(mockUsersRepository.findOne).toHaveBeenCalledWith({
        where: { username },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found by username', async () => {
      // Preparación
      const username = 'nonexistentuser';

      // Configurar mocks
      (mockUsersRepository.findOne as jest.Mock).mockResolvedValue(null);

      // Ejecución y verificación
      await expect(service.findByUsername(username)).rejects.toThrow(NotFoundException);
      expect(mockUsersRepository.findOne).toHaveBeenCalledWith({
        where: { username },
      });
    });
  });
});