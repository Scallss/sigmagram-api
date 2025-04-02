import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from '../database/database.service';
import { CreateCommentDto, UpdateCommentDto } from './dto';

@Injectable()
export class CommentsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(userId: string, createCommentDto: CreateCommentDto) {
    const { postId, content } = createCommentDto;

    // Use a transaction to ensure both operations succeed or fail together
    return this.databaseService.$transaction(async (prisma) => {
      // Create the comment
      const comment = await prisma.comment.create({
        data: {
          content,
          authorId: userId,
          postId,
        },
      });

      // Increment the post's commentsCount
      await prisma.post.update({
        where: { id: postId },
        data: {
          commentsCount: {
            increment: 1,
          },
        },
      });

      return comment;
    });
  }

  async findAllByPost(postId: string) {
    return this.databaseService.comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { username: true, profilePicture: true },
        },
      },
    });
  }

  async update(id: string, userId: string, updateCommentDto: UpdateCommentDto) {
    const comment = await this.databaseService.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('You are not authorized to update this comment');
    }

    return this.databaseService.comment.update({
      where: { id },
      data: updateCommentDto,
    });
  }

  async remove(id: string, userId: string) {
    const comment = await this.databaseService.comment.findUnique({
      where: { id },
      select: {
        id: true,
        authorId: true,
        postId: true,
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('You are not authorized to delete this comment');
    }

    // Use a transaction to ensure both operations succeed or fail together
    return this.databaseService.$transaction(async (prisma) => {
      // Delete the comment
      const deletedComment = await prisma.comment.delete({
        where: { id },
      });

      // Decrement the post's commentsCount
      await prisma.post.update({
        where: { id: comment.postId },
        data: {
          commentsCount: {
            decrement: 1,
          },
        },
      });

      return deletedComment;
    });
  }
}