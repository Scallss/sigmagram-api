import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersServiceMock: any;

  beforeEach(async () => {
    usersServiceMock = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: usersServiceMock }
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call usersService.findAll with search term', async () => {
      const search = 'test';
      const expectedResult = [{ id: 'user-1', username: 'testuser' }];
      
      usersServiceMock.findAll.mockResolvedValue(expectedResult);
      
      expect(await controller.findAll(search)).toBe(expectedResult);
      expect(usersServiceMock.findAll).toHaveBeenCalledWith(search);
    });
  });

  describe('editMe', () => {
    it('should call usersService.update with userId and dto', async () => {
      const userId = 'user-id';
      const dto = { profilePicture: 'new-picture.jpg' };
      const expectedResult = { id: userId, ...dto };
      
      usersServiceMock.update.mockResolvedValue(expectedResult);
      
      expect(await controller.editMe(userId, dto)).toBe(expectedResult);
      expect(usersServiceMock.update).toHaveBeenCalledWith(userId, dto);
    });
  });

  describe('deleteMe', () => {
    it('should call usersService.remove with userId', async () => {
      const userId = 'user-id';
      const expectedResult = { id: userId };
      
      usersServiceMock.remove.mockResolvedValue(expectedResult);
      
      expect(await controller.deleteMe(userId)).toBe(expectedResult);
      expect(usersServiceMock.remove).toHaveBeenCalledWith(userId);
    });
  });

  describe('getMe', () => {
    it('should call usersService.findOne with userId', async () => {
      const userId = 'user-id';
      const expectedResult = { id: userId, username: 'testuser' };
      
      usersServiceMock.findOne.mockResolvedValue(expectedResult);
      
      expect(await controller.getMe(userId)).toBe(expectedResult);
      expect(usersServiceMock.findOne).toHaveBeenCalledWith(userId);
    });
  });

  describe('findOne', () => {
    it('should call usersService.findOne with id', async () => {
      const userId = 'user-id';
      const expectedResult = { id: userId, username: 'testuser' };
      
      usersServiceMock.findOne.mockResolvedValue(expectedResult);
      
      expect(await controller.findOne(userId)).toBe(expectedResult);
      expect(usersServiceMock.findOne).toHaveBeenCalledWith(userId);
    });
  });
});