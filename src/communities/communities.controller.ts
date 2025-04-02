import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CommunitiesService } from './communities.service';
import { Prisma } from '@prisma/client';
import { JwtGuard } from '../auth/guard';
import { GetUser } from '../auth/decorator';
import { CreateCommunityDto, UpdateCommunityDto } from './dto';

@UseGuards(JwtGuard)
@Controller('communities')
export class CommunitiesController {
  constructor(private readonly communitiesService: CommunitiesService) {}

  @Post()
  create(@GetUser('id') userId: string, @Body() createCommunityDto: CreateCommunityDto) {
    return this.communitiesService.create(userId, createCommunityDto);
  }

  @Get()
  findAll() {
    return this.communitiesService.findAll();
  }

  @Get('followed')
  getFollowedCommunities(@GetUser('id') userId: string) {
    return this.communitiesService.getFollowedCommunities(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetUser('id') userId: string) {
  return this.communitiesService.findOne(id, userId);
}

  @Patch(':id')
  update(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @Body() updateCommunityDto: UpdateCommunityDto,
  ) {
    return this.communitiesService.update(id, userId, updateCommunityDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.communitiesService.remove(id, userId);
  }

  @Post(':id/follow')
  followCommunity(@GetUser('id') userId: string, @Param('id') communityId: string) {
    return this.communitiesService.followCommunity(userId, communityId);
  }

  @Delete(':id/unfollow')
  unfollowCommunity(@GetUser('id') userId: string, @Param('id') communityId: string) {
    return this.communitiesService.unfollowCommunity(userId, communityId);
  }
}