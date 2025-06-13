import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Logger } from '@nestjs/common';
import { SupportService } from './support.service';
import { Support } from './support.entity';
import { CreateSupportDto, UpdateSupportDto } from './dto/support.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/role/role.guard';

@UseGuards(AuthGuard, RolesGuard)
@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get()
  // @Roles('Admin')
  async findAll(
    @Query('page') currentPage = '1',
    @Query('limit') itemsPerPage = '10',
    @Query('name') name?: string,
    @Query('company_id') company_id?: string,
  ): Promise<{ items: Support[]; currentPage: number; totalItems: number; totalPages: number }> {
    const filters = {
      name: name || '',
      company_id: company_id || '',
    };

    return this.supportService.findAll(parseInt(currentPage, 10), parseInt(itemsPerPage, 10), filters);
  }

  @Get(':id')
  // @Roles('Admin')
  async findOne(
    @Param('id') id: string, 
  ): Promise<Support> {
    return this.supportService.findOne(parseInt(id, 10));
  }

  @Post()
  // @Roles('Admin')
  async create(@Body() createSupportDto: CreateSupportDto): Promise<Support> {
    return this.supportService.create(createSupportDto);
  }

  @Put(':id')
  // @Roles('Admin')
  async update(
    @Param('id') id: string,
    @Body() updateSupportDto: UpdateSupportDto
  ): Promise<Support> {
    return this.supportService.update(parseInt(id, 10), updateSupportDto);
  }

  @Delete(':id')
  // @Roles('Admin')
  async delete(@Param('id') id: string): Promise<void> {
    return this.supportService.delete(parseInt(id, 10));
  }
}