import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UnauthorizedException } from '@nestjs/common';

// Mock para AuthService
const mockAuthService = {
  login: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    // Resetear todos los mocks antes de cada test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should return access token for valid credentials', async () => {
      // Preparación
      const loginDto = {
        username: 'testuser',
        password: 'password123',
      };
      
      const mockToken = {
        access_token: 'jwt-token-123',
      };

      // Configurar mocks
      mockAuthService.login.mockResolvedValue(mockToken);

      // Ejecución
      const result = await controller.login(loginDto);

      // Verificaciones
      expect(authService.login).toHaveBeenCalledWith(
        loginDto.username,
        loginDto.password,
      );
      expect(result).toEqual(mockToken);
    });

    it('should propagate UnauthorizedException from service', async () => {
      // Preparación
      const loginDto = {
        username: 'testuser',
        password: 'wrongpassword',
      };
      
      // Configurar mocks
      mockAuthService.login.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      // Ejecución y verificación
      await expect(controller.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(authService.login).toHaveBeenCalledWith(
        loginDto.username,
        loginDto.password,
      );
    });
  });
});