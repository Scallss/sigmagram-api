import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../database/database.service';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

describe('AuthService', () => {
  let service: AuthService;
  let databaseServiceMock: any;
  let jwtServiceMock: any;
  let configServiceMock: any;

  beforeEach(async () => {
    databaseServiceMock = {
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    jwtServiceMock = {
      signAsync: jest.fn(),
      verify: jest.fn(),
    };

    configServiceMock = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: DatabaseService, useValue: databaseServiceMock },
        { provide: JwtService, useValue: jwtServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signup', () => {
    it('should create a new user and return tokens', async () => {
      const dto = { username: 'testuser', password: 'password123' };
      const user = { id: 'user-id', username: 'testuser', password: 'hashed_password' };
      const tokens = { access_token: 'access', refresh_token: 'refresh' };

      jest.spyOn(argon, 'hash').mockResolvedValue('hashed_password' as never);
      databaseServiceMock.user.create.mockResolvedValue(user);
      jest.spyOn(service as any, 'generateTokens').mockResolvedValue(tokens);
      jest.spyOn(service as any, 'updateRefreshToken').mockResolvedValue(undefined);

      expect(await service.signup(dto)).toBe(tokens);
      expect(databaseServiceMock.user.create).toHaveBeenCalledWith({
        data: {
          username: dto.username,
          password: 'hashed_password',
        },
      });
    });

    it('should throw ForbiddenException if username is taken', async () => {
      const dto = { username: 'testuser', password: 'password123' };
      const prismaError = new PrismaClientKnownRequestError(
        'Unique constraint failed on the fields: (`username`)',
        {
          code: 'P2002',
          clientVersion: '4.x.x',
        }
      );
  
      jest.spyOn(argon, 'hash').mockResolvedValue('hashed_password' as never);
      databaseServiceMock.user.create.mockRejectedValue(prismaError);
  
      await expect(service.signup(dto)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('signin', () => {
    it('should return tokens if credentials are valid', async () => {
      const dto = { username: 'testuser', password: 'password123' };
      const user = { id: 'user-id', username: 'testuser', password: 'hashed_password' };
      const tokens = { access_token: 'access', refresh_token: 'refresh' };
      const resMock = { cookie: jest.fn() };

      databaseServiceMock.user.findUnique.mockResolvedValue(user);
      jest.spyOn(argon, 'verify').mockResolvedValue(true as never);
      jest.spyOn(service as any, 'generateTokens').mockResolvedValue(tokens);
      jest.spyOn(service as any, 'updateRefreshToken').mockResolvedValue(undefined);

      expect(await service.signin(dto, resMock)).toEqual(tokens);
      expect(resMock.cookie).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user not found', async () => {
      const dto = { username: 'testuser', password: 'password123' };
      const resMock = { cookie: jest.fn() };

      databaseServiceMock.user.findUnique.mockResolvedValue(null);

      await expect(service.signin(dto, resMock)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if password is incorrect', async () => {
      const dto = { username: 'testuser', password: 'password123' };
      const user = { id: 'user-id', username: 'testuser', password: 'hashed_password' };
      const resMock = { cookie: jest.fn() };

      databaseServiceMock.user.findUnique.mockResolvedValue(user);
      jest.spyOn(argon, 'verify').mockResolvedValue(false as never);

      await expect(service.signin(dto, resMock)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('logout', () => {
    it('should clear cookie and update user refresh token', async () => {
      const userId = 'user-id';
      const resMock = { cookie: jest.fn() };

      databaseServiceMock.user.updateMany.mockResolvedValue({ count: 1 });

      await service.logout(userId, resMock);
      expect(resMock.cookie).toHaveBeenCalled();
      expect(databaseServiceMock.user.updateMany).toHaveBeenCalledWith({
        where: { id: userId, refreshToken: { not: null } },
        data: { refreshToken: null },
      });
    });
  });

  describe('renewAccessTokens', () => {
    it('should generate new tokens if refresh token is valid', async () => {
      const userId = 'user-id';
      const user = { id: userId, refreshToken: 'valid_token', username: 'testuser' };
      const accessToken = 'new_access_token';
      const resMock = { cookie: jest.fn() };
      
      databaseServiceMock.user.findUnique.mockResolvedValue(user);
      jwtServiceMock.verify.mockReturnValue({ sub: userId, exp: Date.now() / 1000 + 3600 });
      jest.spyOn(service as any, 'generateAccess').mockResolvedValue(accessToken);

      expect(await service.renewAccessTokens(userId, resMock)).toBe(accessToken);
      expect(resMock.cookie).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const userId = 'user-id';
      const resMock = { cookie: jest.fn() };

      databaseServiceMock.user.findUnique.mockResolvedValue(null);

      await expect(service.renewAccessTokens(userId, resMock)).rejects.toThrow(UnauthorizedException);
    });
  });
});