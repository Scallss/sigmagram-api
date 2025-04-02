import { Test, TestingModule } from '@nestjs/testing';
import { LikesService } from './likes.service';
import { DatabaseService } from '../database/database.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('LikesService', () => {
  let service: LikesService;
  let databaseServiceMock: any;

  beforeEach(async () => {
    databaseServiceMock = {
      like: {
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      post: {
        update: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(databaseServiceMock)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LikesService,
        { provide: DatabaseService, useValue: databaseServiceMock },
      ],
    }).compile();

    service = module.get<LikesService>(LikesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('likePost', () => {
    it('should create a like and increment post like count', async () => {
      const userId = 'user-id';
      const postId = 'post-id';
      const like = { id: 'like-id', userId, postId, createdAt: new Date() };
      
      databaseServiceMock.like.findUnique.mockResolvedValue(null);
      databaseServiceMock.like.create.mockResolvedValue(like);
      databaseServiceMock.post.update.mockResolvedValue({ id: postId, likesCount: 1 });
      
      expect(await service.likePost(userId, postId)).toBe(like);
      expect(databaseServiceMock.like.findUnique).toHaveBeenCalledWith({
        where: { unique_user_post_like: { userId, postId } },
      });
      expect(databaseServiceMock.like.create).toHaveBeenCalledWith({
        data: { userId, postId },
      });
      expect(databaseServiceMock.post.update).toHaveBeenCalledWith({
        where: { id: postId },
        data: {
          likesCount: {
            increment: 1,
          },
        },
      });
    });

    it('should throw ConflictException if already liked', async () => {
      const userId = 'user-id';
      const postId = 'post-id';
      const existingLike = { id: 'like-id', userId, postId, createdAt: new Date() };
      
      databaseServiceMock.like.findUnique.mockResolvedValue(existingLike);
      
      await expect(service.likePost(userId, postId))
        .rejects.toThrow(ConflictException);
    });
  });

  describe('unlikePost', () => {
    it('should delete a like and decrement post like count', async () => {
      const userId = 'user-id';
      const postId = 'post-id';
      const existingLike = { id: 'like-id', userId, postId, createdAt: new Date() };
      
      databaseServiceMock.like.findUnique.mockResolvedValue(existingLike);
      databaseServiceMock.like.delete.mockResolvedValue(existingLike);
      databaseServiceMock.post.update.mockResolvedValue({ id: postId, likesCount: 0 });
      
      expect(await service.unlikePost(userId, postId)).toBe(existingLike);
      expect(databaseServiceMock.like.findUnique).toHaveBeenCalledWith({
        where: { unique_user_post_like: { userId, postId } },
      });
      expect(databaseServiceMock.like.delete).toHaveBeenCalledWith({
        where: {
          unique_user_post_like: { userId, postId },
        },
      });
      expect(databaseServiceMock.post.update).toHaveBeenCalledWith({
        where: { id: postId },
        data: {
          likesCount: {
            decrement: 1,
          },
        },
      });
    });

    it('should throw NotFoundException if like not found', async () => {
      const userId = 'user-id';
      const postId = 'post-id';
      
      databaseServiceMock.like.findUnique.mockResolvedValue(null);
      
      await expect(service.unlikePost(userId, postId))
        .rejects.toThrow(NotFoundException);
    });
  });
});