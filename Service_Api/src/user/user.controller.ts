import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './user.entity';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/role/role.guard';


@UseGuards(AuthGuard, RolesGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  // @Roles('Admin')
  async findAll(
    @Query('page') currentPage = '1',
    @Query('limit') itemsPerPage = '10',
    @Query('username') username?: string,
    @Query('firstName') firstName?: string,
    @Query('company') company?: string,
    @Query('company_id') company_id?: string,
    @Query('manager_id') manager_id?: string,
    @Query('type') type?: string,
    @Query('level') level?: string
  ): Promise<{ items: User[]; currentPage: number; totalItems: number; totalPages: number }> {
    const filters = {
      username: username || '',
      firstName: firstName || '',
      company: company || '',
      company_id: company_id || '',
      manager_id: manager_id || '',
      type: type || '',
      level: level || ''
    };

    return this.userService.findAll(parseInt(currentPage, 10), parseInt(itemsPerPage, 10), filters);
  }
  
  @Get('forCreateManager')
  // @Roles('Admin')
  async findAllForManager(
    // @Query('page') currentPage = '1',
    // @Query('limit') itemsPerPage = '10',
    @Query('name') name?: string,
    @Query('type') type?: string,
    @Query('company_id') company_id?: string,
    @Query('order') order?: string
  ): Promise<{ items: User[]; }> {
    const filters = {
      name: name || '',
      type: type || '',
      company_id: company_id || '',
      order: order || ''
    };
  
    return this.userService.findAllForManager(filters);
  }

  @Get(':id')
  // @Roles('Admin')
  async findOne(@Param('id') id: string): Promise<User> {
    return this.userService.findOne(id);
  }
}