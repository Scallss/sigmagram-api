import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { Prisma, User } from '@prisma/client';
import { JwtGuard } from '../auth/guard';
import { GetUser } from '../auth/decorator';

@UseGuards(JwtGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  findAll(@Query('search') search: string) {
    return this.usersService.findAll(search);
  }

  @Patch()
  editMe(
    @GetUser('id') userId: string,
    @Body() dto: Prisma.UserUpdateInput,
  ) {
    return this.usersService.update(userId, dto);
  }

  @Delete()
  deleteMe(@GetUser('id') userId: string) {
    return this.usersService.remove(userId);
  }

  @Get('me')
  getMe(@GetUser('id') userId: string) {
    return this.usersService.findOne(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }
}
