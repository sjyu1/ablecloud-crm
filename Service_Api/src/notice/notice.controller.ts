import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { NoticeService } from './notice.service';
import { Notice } from './notice.entity';
import { CreateNoticeDto, UpdateNoticeDto } from './dto/notice.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/role/role.guard';

@UseGuards(AuthGuard, RolesGuard)
@Controller('notice')
export class NoticeController {
  constructor(private readonly noticeService: NoticeService) {}

  @Get()
  // @Roles('Admin')
  async findAll(
    @Query('page') currentPage = '1',
    @Query('limit') itemsPerPage = '10',
    @Query('title') title?: string,
    @Query('level') level?: string,
    @Query('company_id') company_id?: string
  ): Promise<{ data: Notice[]; pagination: {} }> {
    const filters = {
      title: title || '',
      level: level || '',
      company_id: company_id || ''
    };

    return this.noticeService.findAll(parseInt(currentPage, 10), parseInt(itemsPerPage, 10), filters);
  }

  @Get(':id')
  // @Roles('Admin')
  async findOne(@Param('id') id: string): Promise<{ data: Notice[]; }> {
    return this.noticeService.findOne(parseInt(id, 10));
  }

  @Post()
  // @Roles('Admin')
  async create(@Body() createNoticeDto: CreateNoticeDto): Promise<Notice> {
    return this.noticeService.create(createNoticeDto);
  }

  @Put(':id')
  // @Roles('Admin')
  async update(
    @Param('id') id: string,
    @Body() updateNoticeDto: UpdateNoticeDto
  ): Promise<Notice> {
    return this.noticeService.update(parseInt(id, 10), updateNoticeDto);
  }

  @Delete(':id')
  // @Roles('Admin')
  async delete(@Param('id') id: string): Promise<void> {
    return this.noticeService.delete(parseInt(id, 10));
  }
}