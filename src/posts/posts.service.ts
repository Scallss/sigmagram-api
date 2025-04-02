import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from '../database/database.service';
import { CreatePostDto } from './dto';

@Injectable()
export class PostsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(id: string, createPostDto: CreatePostDto) {
    return this.databaseService.post.create({
      data: {
        ...createPostDto,
        authorId: id,
      },
    });
  }

  async findAll(userId: string, skip: number, take: number, communityId?: string) {
    // If communityId is provided, filter by that specific community
    if (communityId) {
      const posts = await this.databaseService.post.findMany({
        skip,
        take,
        where: { communityId },
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: { id: true, username: true, profilePicture: true },
          },
          community: {
            select: { id: true, category: true },
          },
        },
      });
  
      // Add like status to return 
      return this.addLikeStatusToPosts(posts, userId);
    } else {
      // Get communities the user follows
      const followedCommunities = await this.databaseService.communityFollower.findMany({
        where: { userId },
        select: { communityId: true },
      });
      
      const communityIds = followedCommunities.map((follow) => follow.communityId);
      
      // If user doesn't follow any communities, return empty array
      if (communityIds.length === 0) {
        return [];
      }
      
      // Get posts from followed communities
      const posts = await this.databaseService.post.findMany({
        skip,
        take,
        where: {
          communityId: { in: communityIds },
        },
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: { id: true, username: true, profilePicture: true },
          },
          community: {
            select: { id: true, category: true },
          },
        },
      });
      
      // Add like status to posts
      return this.addLikeStatusToPosts(posts, userId);
    }
  }
  
  // Helper method to add like status to posts
  private async addLikeStatusToPosts(posts, userId: string) {
    return Promise.all(
      posts.map(async (post) => {
        const like = await this.databaseService.like.findUnique({
          where: {
            unique_user_post_like: { userId, postId: post.id },
          },
        });
  
        return {
          ...post,
          isLiked: !!like,
        };
      })
    );
  }
  
  async findOne(id: string) {
    return this.databaseService.post.findUnique({
      where: { id },
      include: {
        author: {
          select: { username: true, profilePicture: true },
        },
        community: {
          select: { category: true },
        },
      },
    });
  }
  
  async update(id: string, userId: string,updatePostDto: Prisma.PostUpdateInput) {
    const post = await this.findOne(id);

    if (!post) {
      throw new NotFoundException('Post not found');
    } else if (post.authorId !== userId) {
      throw new ForbiddenException('You are not authorized to update this post');
    }

    return this.databaseService.post.update({
      where: { id },
      data: updatePostDto,
    });
  }

  async remove(id: string, userId: string) {
    const post = await this.findOne(id);

    if (!post) {
      throw new NotFoundException('Post not found');
    } else if (post.authorId !== userId) {
      throw new ForbiddenException('You are not authorized to update this post');
    }

    return this.databaseService.post.delete({
      where: { id },
    });
  }
}