import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ReleaseService } from './release.service';
import { Release } from './release.entity';
import { CreateReleaseDto, UpdateReleaseDto } from './dto/release.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/role/role.guard';
// import { Roles } from 'src/auth/role/role.decorator';

@UseGuards(AuthGuard, RolesGuard)
@Controller('release')
export class ReleaseController {
  constructor(private readonly releaseService: ReleaseService) {}

  @Post()
  // @Roles('Admin')
  async create(@Body() createReleaseDto: CreateReleaseDto): Promise<Release> {
    return this.releaseService.create(createReleaseDto);
  }

  @Get()
  // @Roles('Admin')
  async findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('version') version?: string
  ) {
    
    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);

    const { releases, total } = await this.releaseService.findAll(
      parsedPage,
      parsedLimit,
      version
    );

    return {
      data: releases,
      meta: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.ceil(total / parsedLimit)
      }
    };
  }

  @Get(':id')
  // @Roles('Admin')
  async findOne(@Param('id') id: string): Promise<Release> {
    return this.releaseService.findOne(parseInt(id, 10));
  }

  @Put(':id')
  // @Roles('Admin')
  async update(
    @Param('id') id: string,
    @Body() updateReleaseDto: UpdateReleaseDto
  ): Promise<Release> {
    return this.releaseService.update(parseInt(id, 10), updateReleaseDto);
  }

  @Delete(':id')
  // @Roles('Admin')
  async remove(@Param('id') id: string): Promise<void> {
    return this.releaseService.remove(parseInt(id, 10));
  }

  @Put(':id/disabled')
  // @Roles('Admin')
  async disabledRelease(
    @Param('id') id: string,
  ): Promise<Release> {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) throw new Error('Invalid ID format');
    return this.releaseService.disabledRelease(numericId);
  }
}