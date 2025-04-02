import { Test, TestingModule } from '@nestjs/testing';
import { PostsService } from './posts.service';
import { DatabaseService } from '../database/database.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('PostsService', () => {
  let service: PostsService;
  let databaseServiceMock: any;

  beforeEach(async () => {
    databaseServiceMock = {
      post: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      communityFollower: {
        findMany: jest.fn(),
      },
      like: {
        findUnique: jest.fn(),
      }
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: DatabaseService, useValue: databaseServiceMock },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and return a post', async () => {
      const userId = 'user-id';
      const createPostDto = { 
        content: 'Test post', 
        photo: 'photo.jpg',
        communityId: 'community-id'
      };
      const expectedResult = { 
        id: 'post-id', 
        authorId: userId,
        ...createPostDto
      };
      
      databaseServiceMock.post.create.mockResolvedValue(expectedResult);
      
      expect(await service.create(userId, createPostDto)).toBe(expectedResult);
      expect(databaseServiceMock.post.create).toHaveBeenCalledWith({
        data: {
          ...createPostDto,
          authorId: userId,
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return posts for a specific community', async () => {
      const userId = 'user-id';
      const skip = 0;
      const take = 5;
      const communityId = 'community-id';
      const posts = [{ id: 'post-1', content: 'Test post' }];
      
      databaseServiceMock.post.findMany.mockResolvedValue(posts);
      databaseServiceMock.like.findUnique.mockResolvedValue(null);

      const result = await service.findAll(userId, skip, take, communityId);
      
      expect(databaseServiceMock.post.findMany).toHaveBeenCalledWith({
        skip,
        take,
        where: { communityId },
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object),
      });
      
      expect(result).toEqual([{...posts[0], isLiked: false}]);
    });

    it('should return posts from followed communities', async () => {
      const userId = 'user-id';
      const skip = 0;
      const take = 5;
      const followedCommunities = [{ communityId: 'community-1' }, { communityId: 'community-2' }];
      const posts = [{ id: 'post-1', content: 'Test post' }];
      
      databaseServiceMock.communityFollower.findMany.mockResolvedValue(followedCommunities);
      databaseServiceMock.post.findMany.mockResolvedValue(posts);
      databaseServiceMock.like.findUnique.mockResolvedValue({ id: 'like-id' });

      const result = await service.findAll(userId, skip, take);
      
      expect(databaseServiceMock.communityFollower.findMany).toHaveBeenCalledWith({
        where: { userId },
        select: { communityId: true },
      });
      
      expect(databaseServiceMock.post.findMany).toHaveBeenCalledWith({
        skip,
        take,
        where: { communityId: { in: ['community-1', 'community-2'] } },
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object),
      });
      
      expect(result).toEqual([{...posts[0], isLiked: true}]);
    });
  });

  describe('findOne', () => {
    it('should find and return a post by id', async () => {
      const postId = 'post-id';
      const expectedResult = { 
        id: postId, 
        content: 'Test post',
        author: { username: 'testuser' },
        community: { category: 'test' } 
      };
      
      databaseServiceMock.post.findUnique.mockResolvedValue(expectedResult);
      
      expect(await service.findOne(postId)).toBe(expectedResult);
      expect(databaseServiceMock.post.findUnique).toHaveBeenCalledWith({
        where: { id: postId },
        include: expect.any(Object),
      });
    });
  });

  describe('update', () => {
    it('should update a post if user is author', async () => {
      const postId = 'post-id';
      const userId = 'user-id';
      const updatePostDto = { content: 'Updated content' };
      const post = { 
        id: postId, 
        authorId: userId, 
        content: 'Test post',
        createdAt: new Date(),
        updatedAt: new Date(),
        photo: 'photo.jpg',
        likesCount: 0,
        commentsCount: 0,
        communityId: 'community-id',
        author: { 
          username: 'testuser',
          profilePicture: null
        },
        community: { 
          category: 'test' 
        }
      };
      const updatedPost = { ...post, ...updatePostDto };
      
      jest.spyOn(service, 'findOne').mockResolvedValue(post);
      databaseServiceMock.post.update.mockResolvedValue(updatedPost);
      
      expect(await service.update(postId, userId, updatePostDto)).toBe(updatedPost);
      expect(databaseServiceMock.post.update).toHaveBeenCalledWith({
        where: { id: postId },
        data: updatePostDto,
      });
    });

    it('should throw ForbiddenException if user is not author', async () => {
      const postId = 'post-id';
      const userId = 'user-id';
      const differentUserId = 'different-user-id';
      const updatePostDto = { content: 'Updated content' };
      const post = { 
        id: postId, 
        authorId: differentUserId, 
        content: 'Test post',
        createdAt: new Date(),
        updatedAt: new Date(),
        photo: 'photo.jpg',
        likesCount: 0,
        commentsCount: 0,
        communityId: 'community-id',
        author: { 
          username: 'testuser',
          profilePicture: null
        },
        community: { 
          category: 'test' 
        }
      };
      
      jest.spyOn(service, 'findOne').mockResolvedValue(post);
      
      await expect(service.update(postId, userId, updatePostDto))
        .rejects.toThrow(ForbiddenException);
    });

  });

  describe('remove', () => {
    it('should delete a post if user is author', async () => {
      const postId = 'post-id';
      const userId = 'user-id';
      const post = { 
        id: postId, 
        authorId: userId, 
        content: 'Test post',
        createdAt: new Date(),
        updatedAt: new Date(),
        photo: 'photo.jpg',
        likesCount: 0,
        commentsCount: 0,
        communityId: 'community-id',
        author: { 
          username: 'testuser',
          profilePicture: null
        },
        community: { 
          category: 'test' 
        }
      };
      
      jest.spyOn(service, 'findOne').mockResolvedValue(post);
      databaseServiceMock.post.delete.mockResolvedValue(post);
      
      expect(await service.remove(postId, userId)).toBe(post);
      expect(databaseServiceMock.post.delete).toHaveBeenCalledWith({
        where: { id: postId },
      });
    });
  });
});