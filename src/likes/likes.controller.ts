import { Controller, Post, Delete, Param, UseGuards } from '@nestjs/common';
import { LikesService } from './likes.service';
import { JwtGuard } from '../auth/guard';
import { GetUser } from '../auth/decorator';

@UseGuards(JwtGuard)
@Controller('likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post(':postId')
  likePost(@GetUser('id') userId: string, @Param('postId') postId: string) {
    return this.likesService.likePost(userId, postId);
  }

  @Delete(':postId')
  unlikePost(@GetUser('id') userId: string, @Param('postId') postId: string) {
    return this.likesService.unlikePost(userId, postId);
  }
}