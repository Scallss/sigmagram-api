import { Test, TestingModule } from '@nestjs/testing';
import { CommentsService } from './comments.service';
import { DatabaseService } from '../database/database.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CreateCommentDto, UpdateCommentDto } from './dto';

describe('CommentsService', () => {
  let service: CommentsService;
  let databaseServiceMock: any;

  beforeEach(async () => {
    databaseServiceMock = {
      comment: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      post: {
        update: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(databaseServiceMock)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        { provide: DatabaseService, useValue: databaseServiceMock },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a comment and increment post comment count', async () => {
      const userId = 'user-id';
      const createCommentDto: CreateCommentDto = { 
        content: 'Test comment', 
        postId: 'post-id',
      };
      const comment = { 
        id: 'comment-id', 
        authorId: userId,
        content: createCommentDto.content,
        postId: createCommentDto.postId
      };
      
      databaseServiceMock.comment.create.mockResolvedValue(comment);
      
      expect(await service.create(userId, createCommentDto)).toBe(comment);
      expect(databaseServiceMock.comment.create).toHaveBeenCalledWith({
        data: {
          content: createCommentDto.content,
          authorId: userId,
          postId: createCommentDto.postId,
        },
      });
      
      expect(databaseServiceMock.post.update).toHaveBeenCalledWith({
        where: { id: createCommentDto.postId },
        data: {
          commentsCount: {
            increment: 1,
          },
        },
      });
    });
  });

  describe('findAllByPost', () => {
    it('should return all comments for a post', async () => {
      const postId = 'post-id';
      const comments = [
        { 
          id: 'comment-1', 
          content: 'Test comment',
          author: { username: 'user1' } 
        }
      ];
      
      databaseServiceMock.comment.findMany.mockResolvedValue(comments);
      
      expect(await service.findAllByPost(postId)).toBe(comments);
      expect(databaseServiceMock.comment.findMany).toHaveBeenCalledWith({
        where: { postId },
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: { username: true, profilePicture: true },
          },
        },
      });
    });
  });

  describe('update', () => {
    it('should update a comment if user is author', async () => {
      const commentId = 'comment-id';
      const userId = 'user-id';
      const updateCommentDto: UpdateCommentDto = { content: 'Updated comment' };
      const comment = { id: commentId, authorId: userId };
      const updatedComment = { ...comment, content: updateCommentDto.content };
      
      databaseServiceMock.comment.findUnique.mockResolvedValue(comment);
      databaseServiceMock.comment.update.mockResolvedValue(updatedComment);
      
      expect(await service.update(commentId, userId, updateCommentDto)).toBe(updatedComment);
      expect(databaseServiceMock.comment.update).toHaveBeenCalledWith({
        where: { id: commentId },
        data: updateCommentDto,
      });
    });

    it('should throw ForbiddenException if user is not author', async () => {
      const commentId = 'comment-id';
      const userId = 'user-id';
      const differentUserId = 'different-user-id';
      const updateCommentDto: UpdateCommentDto = { content: 'Updated comment' };
      const comment = { id: commentId, authorId: differentUserId };
      
      databaseServiceMock.comment.findUnique.mockResolvedValue(comment);
      
      await expect(service.update(commentId, userId, updateCommentDto))
        .rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if comment not found', async () => {
      const commentId = 'comment-id';
      const userId = 'user-id';
      const updateCommentDto: UpdateCommentDto = { content: 'Updated comment' };
      
      databaseServiceMock.comment.findUnique.mockResolvedValue(null);
      
      await expect(service.update(commentId, userId, updateCommentDto))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a comment and decrement post comment count', async () => {
      const commentId = 'comment-id';
      const userId = 'user-id';
      const postId = 'post-id';
      const comment = { id: commentId, authorId: userId, postId };
      
      databaseServiceMock.comment.findUnique.mockResolvedValue(comment);
      databaseServiceMock.comment.delete.mockResolvedValue(comment);
      
      expect(await service.remove(commentId, userId)).toBe(comment);
      expect(databaseServiceMock.comment.delete).toHaveBeenCalledWith({
        where: { id: commentId },
      });
      
      expect(databaseServiceMock.post.update).toHaveBeenCalledWith({
        where: { id: postId },
        data: {
          commentsCount: {
            decrement: 1,
          },
        },
      });
    });
  });
});