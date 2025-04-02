import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { DatabaseService } from '../database/database.service';

describe('UsersService', () => {
  let service: UsersService;
  let databaseServiceMock: any;

  beforeEach(async () => {
    databaseServiceMock = {
      user: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: DatabaseService, useValue: databaseServiceMock },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and return a user', async () => {
      const userData = { username: 'testuser', password: 'password123' };
      const expectedResult = { id: 'user-id', ...userData };
      
      databaseServiceMock.user.create.mockResolvedValue(expectedResult);
      
      expect(await service.create(userData)).toBe(expectedResult);
      expect(databaseServiceMock.user.create).toHaveBeenCalledWith({
        data: userData,
      });
    });
  });

  describe('findAll', () => {
    it('should find and return users by search term', async () => {
      const search = 'test';
      const expectedResult = [
        { id: 'user-1', username: 'testuser1' },
        { id: 'user-2', username: 'testuser2' },
      ];
      
      databaseServiceMock.user.findMany.mockResolvedValue(expectedResult);
      
      expect(await service.findAll(search)).toBe(expectedResult);
      expect(databaseServiceMock.user.findMany).toHaveBeenCalledWith({
        where: { username: search },
      });
    });
  });

  describe('findOne', () => {
    it('should find and return a user by id', async () => {
      const userId = 'user-id';
      const expectedResult = { id: userId, username: 'testuser' };
      
      databaseServiceMock.user.findUnique.mockResolvedValue(expectedResult);
      
      expect(await service.findOne(userId)).toBe(expectedResult);
      expect(databaseServiceMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });
  });

  describe('update', () => {
    it('should update and return a user', async () => {
      const userId = 'user-id';
      const updateData = { profilePicture: 'new-picture.jpg' };
      const expectedResult = { id: userId, username: 'testuser', ...updateData };
      
      databaseServiceMock.user.update.mockResolvedValue(expectedResult);
      
      expect(await service.update(userId, updateData)).toBe(expectedResult);
      expect(databaseServiceMock.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateData,
      });
    });
  });

  describe('remove', () => {
    it('should delete and return a user', async () => {
      const userId = 'user-id';
      const expectedResult = { id: userId, username: 'testuser' };
      
      databaseServiceMock.user.delete.mockResolvedValue(expectedResult);
      
      expect(await service.remove(userId)).toBe(expectedResult);
      expect(databaseServiceMock.user.delete).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });
  });
});