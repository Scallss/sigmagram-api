import { Test, TestingModule } from '@nestjs/testing';
import { CommunitiesController } from './communities.controller';
import { CommunitiesService } from './communities.service';
import { CreateCommunityDto, UpdateCommunityDto } from './dto';

describe('CommunitiesController', () => {
  let controller: CommunitiesController;
  let communitiesServiceMock: any;

  beforeEach(async () => {
    communitiesServiceMock = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      followCommunity: jest.fn(),
      unfollowCommunity: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommunitiesController],
      providers: [
        { provide: CommunitiesService, useValue: communitiesServiceMock }
      ],
    }).compile();

    controller = module.get<CommunitiesController>(CommunitiesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call communitiesService.create with userId and dto', async () => {
      const userId = 'user-id';
      const createCommunityDto: CreateCommunityDto = { 
        category: 'Technology', 
        homePhoto: 'photo.jpg',
        description: 'Tech community'
      };
      const expectedResult = { id: 'community-id', ...createCommunityDto };
      
      communitiesServiceMock.create.mockResolvedValue(expectedResult);
      
      expect(await controller.create(userId, createCommunityDto)).toBe(expectedResult);
      expect(communitiesServiceMock.create).toHaveBeenCalledWith(userId, createCommunityDto);
    });
  });

  describe('findAll', () => {
    it('should call communitiesService.findAll', async () => {
      const expectedResult = [{ id: 'community-1' }];
      
      communitiesServiceMock.findAll.mockResolvedValue(expectedResult);
      
      expect(await controller.findAll()).toBe(expectedResult);
      expect(communitiesServiceMock.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should call communitiesService.findOne with id and userId', async () => {
      const communityId = 'community-id';
      const userId = 'user-id';
      const expectedResult = { id: communityId };
      
      communitiesServiceMock.findOne.mockResolvedValue(expectedResult);
      
      expect(await controller.findOne(communityId, userId)).toBe(expectedResult);
      expect(communitiesServiceMock.findOne).toHaveBeenCalledWith(communityId, userId);
    });
  });

  describe('update', () => {
    it('should call communitiesService.update with id, userId and dto', async () => {
      const communityId = 'community-id';
      const userId = 'user-id';
      const updateCommunityDto: UpdateCommunityDto = { description: 'Updated description' };
      const expectedResult = { id: communityId, ...updateCommunityDto };
      
      communitiesServiceMock.update.mockResolvedValue(expectedResult);
      
      expect(await controller.update(communityId, userId, updateCommunityDto)).toBe(expectedResult);
      expect(communitiesServiceMock.update).toHaveBeenCalledWith(
        communityId, 
        userId, 
        updateCommunityDto
      );
    });
  });

  describe('remove', () => {
    it('should call communitiesService.remove with id and userId', async () => {
      const communityId = 'community-id';
      const userId = 'user-id';
      const expectedResult = { id: communityId };
      
      communitiesServiceMock.remove.mockResolvedValue(expectedResult);
      
      expect(await controller.remove(communityId, userId)).toBe(expectedResult);
      expect(communitiesServiceMock.remove).toHaveBeenCalledWith(communityId, userId);
    });
  });

  describe('followCommunity', () => {
    it('should call communitiesService.followCommunity with userId and communityId', async () => {
      const communityId = 'community-id';
      const userId = 'user-id';
      const expectedResult = { id: 'follow-id', userId, communityId };
      
      communitiesServiceMock.followCommunity.mockResolvedValue(expectedResult);
      
      expect(await controller.followCommunity(userId, communityId)).toBe(expectedResult);
      expect(communitiesServiceMock.followCommunity).toHaveBeenCalledWith(userId, communityId);
    });
  });

  describe('unfollowCommunity', () => {
    it('should call communitiesService.unfollowCommunity with userId and communityId', async () => {
      const communityId = 'community-id';
      const userId = 'user-id';
      const expectedResult = { id: 'follow-id', userId, communityId };
      
      communitiesServiceMock.unfollowCommunity.mockResolvedValue(expectedResult);
      
      expect(await controller.unfollowCommunity(userId, communityId)).toBe(expectedResult);
      expect(communitiesServiceMock.unfollowCommunity).toHaveBeenCalledWith(userId, communityId);
    });
  });
});