import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class UsersService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(createUserDto: Prisma.UserCreateInput) {
    return this.databaseService.user.create({
      data: createUserDto,
    })
  }

  async findAll(search: string) {
    return this.databaseService.user.findMany({
      where: { 
        username: search,
      } 
    });
  }

  async findOne(id: string) {
    return this.databaseService.user.findUnique({
      where: { 
        id: id
      } 
    });
  }

  async update(id: string, updateUserDto: Prisma.UserUpdateInput) {
    return this.databaseService.user.update({
      where: { 
        id, 
      },
      data: updateUserDto,
    });
  }

  async remove(id: string) {
    return this.databaseService.user.delete({
      where: { 
        id,
      } 
    });
  }
}
