import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserType } from '@prisma/client';
import { SignupDto, SignInDto } from '../dtos/auth.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            signUp: jest.fn(),
            signIn: jest.fn(),
            logout: jest.fn(),
            refreshTokens: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signUp', () => {
    it('should call authService.signUp() with the correct parameters', async () => {
      const dto: SignupDto = {
        email: 'test@example.com',
        password: 'testpassword',
        name: 'testuser',
      };
      const userType = UserType.USER;
      await controller.signUp(dto, userType);
      expect(authService.signUp).toHaveBeenCalledWith(dto, userType);
    });
  });

  describe('signIn', () => {
    it('should call authService.signIn() with the correct parameters', async () => {
      const dto: SignInDto = {
        email: 'test@example.com',
        password: 'testpassword',
      };
      await controller.signIn(dto);
      expect(authService.signIn).toHaveBeenCalledWith(dto);
    });
  });

  // Add similar test cases for the rest of the controller methods...
});
