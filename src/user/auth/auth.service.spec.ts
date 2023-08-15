import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { UserType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService, PrismaService],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('signUp', () => {
    it('should sign up a new user', async () => {
      const signUpParams = {
        email: 'test@example.com',
        password: 'testpassword',
        name: 'testuser',
      };

      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prismaService.user, 'create').mockResolvedValue({
        id: 1,
        email: signUpParams.email,
        name: signUpParams.name,
        password: signUpParams.password,
        user_type: UserType.USER,
        refresh_token: null,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const result = await service.signUp(signUpParams, UserType.USER);
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
    });

    it('should throw ConflictException if user already exists', async () => {
      const signUpParams = {
        email: 'test@example.com',
        password: 'testpassword',
        name: 'testuser',
      };

      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue({
        id: 1,
        email: signUpParams.email,
        name: signUpParams.name,
        password: signUpParams.password,
        user_type: UserType.USER,
        refresh_token: null,
        created_at: new Date(),
        updated_at: new Date(),
      });

      await expect(
        service.signUp(signUpParams, UserType.USER),
      ).rejects.toThrowError();
    });
  });

  describe('signIn', () => {
    it('should sign in a user', async () => {
      const signInParams = {
        email: 'test@example.com',
        password: 'testpassword',
      };
      const user = {
        id: 1,
        email: signInParams.email,
        name: 'testuser',
        password: await bcrypt.hash(signInParams.password, 10),
        user_type: UserType.USER,
        refresh_token: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const findFirstSpy = jest.spyOn(prismaService.user, 'findFirst');
      findFirstSpy.mockResolvedValue(user);

      // The compare method should be public in the AuthService class
      const compareSpy = jest.spyOn(service, 'compare' as keyof AuthService);
      compareSpy.mockResolvedValue(true);

      const result = await service.signIn(signInParams);
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');

      findFirstSpy.mockRestore();
      compareSpy.mockRestore();
    });
  });

  describe('logout', () => {
    it('should log out a user', async () => {
      const userId = 1;
      jest
        .spyOn(prismaService.user, 'updateMany')
        .mockResolvedValue({ count: 1 });

      const result = await service.logout(userId);
      expect(result).toBe(true);
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens', async () => {
      const userId = 1;
      const refreshToken = 'mockedRefreshToken';
      const user = {
        id: userId,
        email: 'test@example.com',
        name: 'testuser',
        password: 'testpassword',
        user_type: UserType.USER,
        refresh_token: refreshToken,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const findUniqueSpy = jest.spyOn(prismaService.user, 'findUnique');
      findUniqueSpy.mockResolvedValue(user);

      // The compare method should be public in the AuthService class
      const compareSpy = jest.spyOn(service, 'compare' as keyof AuthService);
      compareSpy.mockResolvedValue(true);

      const result = await service.refreshTokens(userId, refreshToken);
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');

      findUniqueSpy.mockRestore();
      compareSpy.mockRestore();
    });
  });
});
