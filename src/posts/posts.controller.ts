import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import { PostsService } from './posts.service';
import { Prisma, User } from '@prisma/client';
import { JwtGuard } from '../auth/guard';
import { GetUser } from 'src/auth/decorator';
import { CreatePostDto, UpdatePostDto } from './dto';

@UseGuards(JwtGuard)
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  create(@GetUser('id') userId: string, @Body() createPostDto: CreatePostDto) {
    return this.postsService.create(userId, createPostDto);
  }

  @Get()
  findAll(
    @GetUser('id') userId: string,
    @Query('skip') skip: string,
    @Query('communityId') communityId?: string,
  ) {
    const skipNumber = parseInt(skip, 10) || 0;
    const takeNumber = 5;
    return this.postsService.findAll(userId, skipNumber, takeNumber, communityId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @Body() updatePostDto: UpdatePostDto,
  ) {

    return this.postsService.update(id, userId,updatePostDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.postsService.remove(id, userId);
  }
}