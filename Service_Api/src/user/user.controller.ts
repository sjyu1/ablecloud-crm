import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './user.entity';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/role/role.guard';
import { log } from 'console';

@UseGuards(AuthGuard, RolesGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('forCreateManager')
  // @Roles('Admin')
  async findAllForManager(
    @Query('page') currentPage = '1',
    @Query('limit') itemsPerPage = '10',
    @Query('name') name?: string,
    @Query('type') type?: string,
    @Query('company_id') company_id?: string
  ): Promise<{ items: User[]; }> {
    const filters = {
      name: name || '',
      type: type || '',
      company_id: company_id || ''
    };

    return this.userService.findAllForManager(parseInt(currentPage, 10), parseInt(itemsPerPage, 10), filters);
  }

  // @Get(':id')
  // // @Roles('Admin')
  // async findOne(@Param('id') id: string): Promise<User> {
  //   return this.userService.findOne(parseInt(id, 10));
  // }
}