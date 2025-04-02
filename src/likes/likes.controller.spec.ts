import { Test, TestingModule } from '@nestjs/testing';
import { LikesController } from './likes.controller';
import { LikesService } from './likes.service';

describe('LikesController', () => {
  let controller: LikesController;
  let likesServiceMock: any;

  beforeEach(async () => {
    likesServiceMock = {
      likePost: jest.fn(),
      unlikePost: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LikesController],
      providers: [
        { provide: LikesService, useValue: likesServiceMock }
      ],
    }).compile();

    controller = module.get<LikesController>(LikesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('likePost', () => {
    it('should call likesService.likePost with userId and postId', async () => {
      const userId = 'user-id';
      const postId = 'post-id';
      const expectedResult = { id: 'like-id', userId, postId, createdAt: new Date() };
      
      likesServiceMock.likePost.mockResolvedValue(expectedResult);
      
      expect(await controller.likePost(userId, postId)).toBe(expectedResult);
      expect(likesServiceMock.likePost).toHaveBeenCalledWith(userId, postId);
    });
  });

  describe('unlikePost', () => {
    it('should call likesService.unlikePost with userId and postId', async () => {
      const userId = 'user-id';
      const postId = 'post-id';
      const expectedResult = { id: 'like-id', userId, postId, createdAt: new Date() };
      
      likesServiceMock.unlikePost.mockResolvedValue(expectedResult);
      
      expect(await controller.unlikePost(userId, postId)).toBe(expectedResult);
      expect(likesServiceMock.unlikePost).toHaveBeenCalledWith(userId, postId);
    });
  });
});