import { Test, TestingModule } from '@nestjs/testing';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { CreateCommentDto, UpdateCommentDto } from './dto';

describe('CommentsController', () => {
  let controller: CommentsController;
  let commentsServiceMock: any;

  beforeEach(async () => {
    commentsServiceMock = {
      create: jest.fn(),
      findAllByPost: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommentsController],
      providers: [
        { provide: CommentsService, useValue: commentsServiceMock }
      ],
    }).compile();

    controller = module.get<CommentsController>(CommentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call commentsService.create with userId and dto', async () => {
      const userId = 'user-id';
      const createCommentDto: CreateCommentDto = { 
        content: 'Test comment', 
        postId: 'post-id',
      };
      const expectedResult = { id: 'comment-id', ...createCommentDto };
      
      commentsServiceMock.create.mockResolvedValue(expectedResult);
      
      expect(await controller.create(userId, createCommentDto)).toBe(expectedResult);
      expect(commentsServiceMock.create).toHaveBeenCalledWith(userId, createCommentDto);
    });
  });

  describe('findAllByPost', () => {
    it('should call commentsService.findAllByPost with postId', async () => {
      const postId = 'post-id';
      const expectedResult = [{ id: 'comment-1' }];
      
      commentsServiceMock.findAllByPost.mockResolvedValue(expectedResult);
      
      expect(await controller.findAllByPost(postId)).toBe(expectedResult);
      expect(commentsServiceMock.findAllByPost).toHaveBeenCalledWith(postId);
    });
  });

  describe('update', () => {
    it('should call commentsService.update with id, userId and dto', async () => {
      const commentId = 'comment-id';
      const userId = 'user-id';
      const updateCommentDto: UpdateCommentDto = { content: 'Updated comment' };
      const expectedResult = { id: commentId, ...updateCommentDto };
      
      commentsServiceMock.update.mockResolvedValue(expectedResult);
      
      expect(await controller.update(commentId, userId, updateCommentDto)).toBe(expectedResult);
      expect(commentsServiceMock.update).toHaveBeenCalledWith(commentId, userId, updateCommentDto);
    });
  });

  describe('remove', () => {
    it('should call commentsService.remove with id and userId', async () => {
      const commentId = 'comment-id';
      const userId = 'user-id';
      const expectedResult = { id: commentId };
      
      commentsServiceMock.remove.mockResolvedValue(expectedResult);
      
      expect(await controller.remove(commentId, userId)).toBe(expectedResult);
      expect(commentsServiceMock.remove).toHaveBeenCalledWith(commentId, userId);
    });
  });
});