import { Test, TestingModule } from '@nestjs/testing';
import { CommunitiesService } from './communities.service';
import { DatabaseService } from '../database/database.service';
import { ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateCommunityDto } from './dto';

describe('CommunitiesService', () => {
  let service: CommunitiesService;
  let databaseServiceMock: any;

  beforeEach(async () => {
    databaseServiceMock = {
      community: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      communityFollower: {
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(databaseServiceMock)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommunitiesService,
        { provide: DatabaseService, useValue: databaseServiceMock },
      ],
    }).compile();

    service = module.get<CommunitiesService>(CommunitiesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and return a community', async () => {
      const userId = 'user-id';
      const createCommunityDto: CreateCommunityDto = { 
        category: 'Technology', 
        homePhoto: 'photo.jpg',
        description: 'Tech community'
      };
      const expectedResult = { 
        id: 'community-id', 
        creatorId: userId,
        ...createCommunityDto
      };
      
      databaseServiceMock.community.create.mockResolvedValue(expectedResult);
      
      expect(await service.create(userId, createCommunityDto)).toBe(expectedResult);
      expect(databaseServiceMock.community.create).toHaveBeenCalledWith({
        data: {
          ...createCommunityDto,
          creatorId: userId,
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return all communities with creator info', async () => {
      const communities = [
        { 
          id: 'community-1', 
          category: 'Technology',
          creator: { username: 'creator1' } 
        }
      ];
      
      databaseServiceMock.community.findMany.mockResolvedValue(communities);
      
      expect(await service.findAll()).toBe(communities);
      expect(databaseServiceMock.community.findMany).toHaveBeenCalledWith({
        include: {
          creator: {
            select: { username: true },
          },
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return a community with follow status', async () => {
      const communityId = 'community-id';
      const userId = 'user-id';
      const community = { 
        id: communityId, 
        category: 'Technology',
        creatorId: 'creator-id',
        creator: { username: 'creator' } 
      };
      
      databaseServiceMock.community.findUnique.mockResolvedValue(community);
      databaseServiceMock.communityFollower.findUnique.mockResolvedValue({ id: 'follow-id' });
      
      const result = await service.findOne(communityId, userId);
      expect(result).toEqual({
        ...community,
        isFollowed: true,
      });
    });

    it('should throw NotFoundException if community not found', async () => {
      const communityId = 'community-id';
      
      databaseServiceMock.community.findUnique.mockResolvedValue(null);
      
      await expect(service.findOne(communityId))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a community if user is creator', async () => {
      const communityId = 'community-id';
      const userId = 'user-id';
      const updateCommunityDto = { description: 'Updated description' };
      const community = { 
        id: communityId, 
        creatorId: userId,
        category: 'Technology',
        isFollowed: false,
        creator: { username: 'creator' },
        createdAt: new Date(),
        updatedAt: new Date(),
        homePhoto: null,
        description: 'Original description',
        followersCount: 0
      };
      const updatedCommunity = { ...community, ...updateCommunityDto };
      
      jest.spyOn(service, 'findOne').mockResolvedValue(community);
      databaseServiceMock.community.update.mockResolvedValue(updatedCommunity);
      
      expect(await service.update(communityId, userId, updateCommunityDto)).toBe(updatedCommunity);
      expect(databaseServiceMock.community.update).toHaveBeenCalledWith({
        where: { id: communityId },
        data: updateCommunityDto,
      });
    });

    it('should throw ForbiddenException if user is not creator', async () => {
      const communityId = 'community-id';
      const userId = 'user-id';
      const differentUserId = 'different-user-id';
      const updateCommunityDto = { description: 'Updated description' };
      const community = { 
        id: communityId, 
        creatorId: differentUserId,
        category: 'Technology',
        // Add missing properties to match the return type
        isFollowed: false,
        creator: { username: 'different-creator' },
        createdAt: new Date(),
        updatedAt: new Date(),
        homePhoto: null,
        description: 'Original description',
        followersCount: 0
      };
      
      jest.spyOn(service, 'findOne').mockResolvedValue(community);
      
      await expect(service.update(communityId, userId, updateCommunityDto))
        .rejects.toThrow(ForbiddenException);
    });
  });

  describe('followCommunity', () => {
    it('should create a community follow relationship', async () => {
      const userId = 'user-id';
      const communityId = 'community-id';
      const community = { id: communityId };
      const follow = { id: 'follow-id', userId, communityId };
      
      databaseServiceMock.community.findUnique.mockResolvedValue(community);
      databaseServiceMock.communityFollower.findUnique.mockResolvedValue(null);
      databaseServiceMock.communityFollower.create.mockResolvedValue(follow);
      
      expect(await service.followCommunity(userId, communityId)).toBe(follow);
      expect(databaseServiceMock.community.update).toHaveBeenCalledWith({
        where: { id: communityId },
        data: {
          followersCount: {
            increment: 1,
          },
        },
      });
    });

    it('should throw ConflictException if already following', async () => {
      const userId = 'user-id';
      const communityId = 'community-id';
      const community = { id: communityId };
      const existingFollow = { id: 'follow-id' };
      
      databaseServiceMock.community.findUnique.mockResolvedValue(community);
      databaseServiceMock.communityFollower.findUnique.mockResolvedValue(existingFollow);
      
      await expect(service.followCommunity(userId, communityId))
        .rejects.toThrow(ConflictException);
    });
  });

  describe('unfollowCommunity', () => {
    it('should delete a community follow relationship', async () => {
      const userId = 'user-id';
      const communityId = 'community-id';
      const existingFollow = { id: 'follow-id' };
      
      databaseServiceMock.communityFollower.findUnique.mockResolvedValue(existingFollow);
      databaseServiceMock.communityFollower.delete.mockResolvedValue(existingFollow);
      
      expect(await service.unfollowCommunity(userId, communityId)).toBe(existingFollow);
      expect(databaseServiceMock.community.update).toHaveBeenCalledWith({
        where: { id: communityId },
        data: {
          followersCount: {
            decrement: 1,
          },
        },
      });
    });

    it('should throw NotFoundException if not following', async () => {
      const userId = 'user-id';
      const communityId = 'community-id';
      
      databaseServiceMock.communityFollower.findUnique.mockResolvedValue(null);
      
      await expect(service.unfollowCommunity(userId, communityId))
        .rejects.toThrow(NotFoundException);
    });
  });
});