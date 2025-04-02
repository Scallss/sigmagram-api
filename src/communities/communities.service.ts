import { ForbiddenException, Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from '../database/database.service';
import { CreateCommunityDto, UpdateCommunityDto} from './dto';

@Injectable()
export class CommunitiesService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(userId: string, createCommunityDto: CreateCommunityDto) {
    return this.databaseService.community.create({
      data: {
        ...createCommunityDto,
        creatorId: userId,
      },
    });
  }

  async findAll() {
    return this.databaseService.community.findMany({
      include: {
        creator: {
          select: { username: true },
        },
      },
    });
  }

  async findOne(id: string, userId?: string) {
    const community = await this.databaseService.community.findUnique({
      where: { id },
      include: {
        creator: {
          select: { username: true },
        },
      },
    });
  
    if (!community) {
      throw new NotFoundException('Community not found');
    }
  
    // If userId is provided, check if the user follows this community
    let isFollowed = false;
    if (userId) {
      const follow = await this.databaseService.communityFollower.findUnique({
        where: {
          unique_user_community_follow: { userId, communityId: id },
        },
      });
      isFollowed = !!follow;
    }
  
    // Return the community with the follow status
    return {
      ...community,
      isFollowed,
    };
  }

  async update(id: string, userId: string, updateCommunityDto: UpdateCommunityDto) {
    const community = await this.findOne(id);
    if (!community) {
      throw new NotFoundException('Community not found');
    } else if (community.creatorId !== userId) {
      throw new ForbiddenException('You are not authorized to update this community');
    }

    return this.databaseService.community.update({
      where: { id },
      data: updateCommunityDto,
    });
  }

  async remove(id: string, userId: string) {
    const community = await this.findOne(id);

    if (!community) {
      throw new NotFoundException('Community not found');
    } else if (community.creatorId !== userId) {
      throw new ForbiddenException('You are not authorized to delete this community');
    }

    return this.databaseService.community.delete({
      where: { id },
    });
  }

  async followCommunity(userId: string, communityId: string) {
    // Check if the community exists
    const community = await this.databaseService.community.findUnique({
      where: { id: communityId },
    });

    if (!community) {
      throw new NotFoundException('Community not found');
    }

    // Check if the user is already following the community
    const existingFollow = await this.databaseService.communityFollower.findUnique({
      where: {
        unique_user_community_follow: { userId, communityId },
      },
    });

    if (existingFollow) {
      throw new ConflictException('You are already following this community');
    }

    // Use a transaction to ensure both operations succeed or fail together
    return this.databaseService.$transaction(async (prisma) => {
      // Add the user to the community's followers
      const follow = await prisma.communityFollower.create({
        data: {
          userId,
          communityId,
        },
      });

      // Increment the community's followersCount
      await prisma.community.update({
        where: { id: communityId },
        data: {
          followersCount: {
            increment: 1,
          },
        },
      });

      return follow;
    });
  }

  async unfollowCommunity(userId: string, communityId: string) {
    // Check if the user is following the community
    const existingFollow = await this.databaseService.communityFollower.findUnique({
      where: {
        unique_user_community_follow: { userId, communityId },
      },
    });

    if (!existingFollow) {
      throw new NotFoundException('You are not following this community');
    }

    // Use a transaction to ensure both operations succeed or fail together
    return this.databaseService.$transaction(async (prisma) => {
      // Remove the user from the community's followers
      const unfollow = await prisma.communityFollower.delete({
        where: {
          unique_user_community_follow: { userId, communityId },
        },
      });

      // Decrement the community's followersCount
      await prisma.community.update({
        where: { id: communityId },
        data: {
          followersCount: {
            decrement: 1,
          },
        },
      });

      return unfollow;
    });
  }
}