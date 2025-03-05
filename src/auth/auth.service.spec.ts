import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Mock para bcrypt
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

// Mock para UsersService
const mockUsersService = {
  findByUsername: jest.fn(),
};

// Mock para JwtService
const mockJwtService = {
  sign: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);

    // Resetear todos los mocks antes de cada test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user object when credentials are valid', async () => {
      // Preparación
      const username = 'testuser';
      const password = 'password123';
      const hashedPassword = 'hashedpassword123';
      
      const mockUser = {
        id: 1,
        username,
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
      };

      // Configurar mocks
      mockUsersService.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Ejecución
      const result = await service.validateUser(username, password);

      // Verificaciones
      expect(mockUsersService.findByUsername).toHaveBeenCalledWith(username);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(result).toEqual({
        id: mockUser.id,
        username: mockUser.username,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        email: mockUser.email,
      });
      expect(result.password).toBeUndefined();
    });

    it('should return null when user not found', async () => {
      // Preparación
      const username = 'nonexistentuser';
      const password = 'password123';

      // Configurar mocks
      mockUsersService.findByUsername.mockResolvedValue(null);

      // Ejecución
      const result = await service.validateUser(username, password);

      // Verificaciones
      expect(mockUsersService.findByUsername).toHaveBeenCalledWith(username);
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      // Preparación
      const username = 'testuser';
      const password = 'wrongpassword';
      const hashedPassword = 'hashedpassword123';
      
      const mockUser = {
        id: 1,
        username,
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
      };

      // Configurar mocks
      mockUsersService.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Ejecución
      const result = await service.validateUser(username, password);

      // Verificaciones
      expect(mockUsersService.findByUsername).toHaveBeenCalledWith(username);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return JWT token when credentials are valid', async () => {
      // Preparación
      const username = 'testuser';
      const password = 'password123';
      
      const mockUser = {
        id: 1,
        username,
      };

      const mockToken = 'jwt-token-123';

      // Configurar mocks - Spy en validateUser
      jest.spyOn(service, 'validateUser').mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue(mockToken);

      // Ejecución
      const result = await service.login(username, password);

      // Verificaciones
      expect(service.validateUser).toHaveBeenCalledWith(username, password);
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        username: mockUser.username,
        sub: mockUser.id,
      });
      expect(result).toEqual({ access_token: mockToken });
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      // Preparación
      const username = 'testuser';
      const password = 'wrongpassword';

      // Configurar mocks
      jest.spyOn(service, 'validateUser').mockResolvedValue(null);

      // Ejecución y verificación
      await expect(service.login(username, password)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(service.validateUser).toHaveBeenCalledWith(username, password);
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });
  });
});