import { Test, TestingModule } from '@nestjs/testing';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { CreatePostDto, UpdatePostDto } from './dto';

describe('PostsController', () => {
  let controller: PostsController;
  let postsServiceMock: any;

  beforeEach(async () => {
    postsServiceMock = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostsController],
      providers: [
        { provide: PostsService, useValue: postsServiceMock }
      ],
    }).compile();

    controller = module.get<PostsController>(PostsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call postsService.create with userId and dto', async () => {
      const userId = 'user-id';
      const createPostDto: CreatePostDto = { 
        content: 'Test post', 
        photo: 'photo.jpg',
        communityId: 'community-id'
      };
      const expectedResult = { id: 'post-id', ...createPostDto };
      
      postsServiceMock.create.mockResolvedValue(expectedResult);
      
      expect(await controller.create(userId, createPostDto)).toBe(expectedResult);
      expect(postsServiceMock.create).toHaveBeenCalledWith(userId, createPostDto);
    });
  });

  describe('findAll', () => {
    it('should call postsService.findAll with correct parameters', async () => {
      const userId = 'user-id';
      const skip = '0';
      const communityId = 'community-id';
      const expectedResult = [{ id: 'post-1' }];
      
      postsServiceMock.findAll.mockResolvedValue(expectedResult);
      
      expect(await controller.findAll(userId, skip, communityId)).toBe(expectedResult);
      expect(postsServiceMock.findAll).toHaveBeenCalledWith(userId, 0, 5, communityId);
    });
  });

  describe('findOne', () => {
    it('should call postsService.findOne with id', async () => {
      const postId = 'post-id';
      const expectedResult = { id: postId };
      
      postsServiceMock.findOne.mockResolvedValue(expectedResult);
      
      expect(await controller.findOne(postId)).toBe(expectedResult);
      expect(postsServiceMock.findOne).toHaveBeenCalledWith(postId);
    });
  });

  describe('update', () => {
    it('should call postsService.update with id, userId and dto', async () => {
      const postId = 'post-id';
      const userId = 'user-id';
      const updatePostDto: UpdatePostDto = { content: 'Updated content' };
      const expectedResult = { id: postId, ...updatePostDto };
      
      postsServiceMock.update.mockResolvedValue(expectedResult);
      
      expect(await controller.update(postId, userId, updatePostDto)).toBe(expectedResult);
      expect(postsServiceMock.update).toHaveBeenCalledWith(postId, userId, updatePostDto);
    });
  });

  describe('remove', () => {
    it('should call postsService.remove with id and userId', async () => {
      const postId = 'post-id';
      const userId = 'user-id';
      const expectedResult = { id: postId };
      
      postsServiceMock.remove.mockResolvedValue(expectedResult);
      
      expect(await controller.remove(postId, userId)).toBe(expectedResult);
      expect(postsServiceMock.remove).toHaveBeenCalledWith(postId, userId);
    });
  });
});