import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class LikesService {
  constructor(private readonly databaseService: DatabaseService) {}

  async likePost(userId: string, postId: string) {
    // Check if the user has already liked the post
    const existingLike = await this.databaseService.like.findUnique({
      where: {
        unique_user_post_like: { userId, postId },
      },
    });

    if (existingLike) {
      throw new ConflictException('You have already liked this post');
    }

    // Use a transaction to ensure both operations succeed or fail together
    return this.databaseService.$transaction(async (prisma) => {
      const like = await prisma.like.create({
        data: {
          userId,
          postId,
        },
      });

      await prisma.post.update({
        where: { id: postId },
        data: {
          likesCount: {
            increment: 1,
          },
        },
      });

      return like;
    });
  }

  async unlikePost(userId: string, postId: string) {
    // Check if the like exists
    const existingLike = await this.databaseService.like.findUnique({
      where: {
        unique_user_post_like: { userId, postId },
      },
    });

    if (!existingLike) {
      throw new NotFoundException('Like not found');
    }

    // Use a transaction to ensure both operations succeed or fail together
    return this.databaseService.$transaction(async (prisma) => {
      const deletedLike = await prisma.like.delete({
        where: {
          unique_user_post_like: { userId, postId },
        },
      });

      await prisma.post.update({
        where: { id: postId },
        data: {
          likesCount: {
            decrement: 1,
          },
        },
      });

      return deletedLike;
    });
  }
}