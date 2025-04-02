import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthDto } from './dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authServiceMock: any;

  beforeEach(async () => {
    authServiceMock = {
      signup: jest.fn(),
      signin: jest.fn(),
      logout: jest.fn(),
      renewAccessTokens: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authServiceMock }
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signup', () => {
    it('should call authService.signup with dto', async () => {
      const dto: AuthDto = { username: 'testuser', password: 'password123' };
      const expectedResult = { access_token: 'token', refresh_token: 'refresh' };
      
      authServiceMock.signup.mockResolvedValue(expectedResult);
      
      expect(await controller.signup(dto)).toBe(expectedResult);
      expect(authServiceMock.signup).toHaveBeenCalledWith(dto);
    });
  });

  describe('signin', () => {
    it('should call authService.signin with dto and response', async () => {
      const dto: AuthDto = { username: 'testuser', password: 'password123' };
      const resMock = {};
      const expectedResult = { access_token: 'token', refresh_token: 'refresh' };
      
      authServiceMock.signin.mockResolvedValue(expectedResult);
      
      expect(await controller.signin(dto, resMock)).toBe(expectedResult);
      expect(authServiceMock.signin).toHaveBeenCalledWith(dto, resMock);
    });
  });

  describe('logout', () => {
    it('should call authService.logout with userId and response', async () => {
      const userId = 'user-id';
      const resMock = {};
      const expectedResult = { message: 'Logged out successfully' };
      
      authServiceMock.logout.mockResolvedValue(expectedResult);
      
      expect(await controller.logout(userId, resMock)).toBe(expectedResult);
      expect(authServiceMock.logout).toHaveBeenCalledWith(userId, resMock);
    });
  });

  describe('renewAccessTokens', () => {
    it('should call authService.renewAccessTokens with userId and response', async () => {
      const body = { userId: 'user-id' };
      const resMock = {};
      const expectedResult = 'access_token';
      
      authServiceMock.renewAccessTokens.mockResolvedValue(expectedResult);
      
      expect(await controller.renewAccessTokens(body, resMock)).toBe(expectedResult);
      expect(authServiceMock.renewAccessTokens).toHaveBeenCalledWith(body.userId, resMock);
    });
  });

  describe('getMe', () => {
    it('should return the user object', async () => {
      const user = { id: 'user-id', username: 'testuser' };
      
      expect(controller.getMe(user)).toBe(user);
    });
  });
});