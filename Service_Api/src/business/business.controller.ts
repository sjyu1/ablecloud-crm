import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Logger } from '@nestjs/common';
import { BusinessService } from './business.service';
import { Business } from './business.entity';
import { Business_history } from './business_history.entity';
import { CreateBusinessDto, UpdateBusinessDto, CreateBusiness_historyDto, UpdateBusiness_historyDto } from './dto/business.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/role/role.guard';

@UseGuards(AuthGuard, RolesGuard)
@Controller('business')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Get()
  // @Roles('Admin')
  async findAll(
    @Query('page') currentPage = '1',
    @Query('limit') itemsPerPage = '10',
    @Query('name') name?: string,
    @Query('available') available?: string,
    @Query('company_id') company_id?: string
  ): Promise<{ items: Business[]; currentPage: number; totalItems: number; totalPages: number }> {
    const filters = {
      name: name || '',
      available: available || '',
      company_id: company_id || ''
    };

    return this.businessService.findAll(parseInt(currentPage, 10), parseInt(itemsPerPage, 10), filters);
  }

  @Get(':id/history')
  // @Roles('Admin')
  async findAllHistory
    (@Param('id') id: string): Promise<Business_history[]> {
    return this.businessService.findAllHistory(parseInt(id, 10));
  }

  @Get(':id')
  // @Roles('Admin')
  async findOne(@Param('id') id: string): Promise<Business> {
    return this.businessService.findOne(parseInt(id, 10));
  }

  @Post()
  // @Roles('Admin')
  async create(@Body() createBusinessDto: CreateBusinessDto): Promise<Business> {
    return this.businessService.create(createBusinessDto);
  }

  @Post(':id/history')
  // @Roles('Admin')
  async createHistory(
    @Param('id') id: string,
    @Body() createBusiness_historyDto: CreateBusiness_historyDto): Promise<Business_history> 
  {
    return this.businessService.createHistory(id, createBusiness_historyDto);
  }

  @Put(':id')
  // @Roles('Admin')
  async update(
    @Param('id') id: string,
    @Body() updateBusinessDto: UpdateBusinessDto
  ): Promise<Business> {
    return this.businessService.update(parseInt(id, 10), updateBusinessDto);
  }

  @Put(':id/history/:historyId')
  // @Roles('Admin')
  async updateHistory(
    @Param('id') id: string,
    @Param('historyId') historyId: string,
    @Body() updateBusiness_historyDto: UpdateBusiness_historyDto
  ): Promise<Business_history> {
    return this.businessService.updateHistory(parseInt(historyId, 10), updateBusiness_historyDto);
  }

  @Delete(':id')
  // @Roles('Admin')
  async delete(@Param('id') id: string): Promise<void> {
    return this.businessService.delete(parseInt(id, 10));
  }

  @Delete(':id/history/:historyId')
  async deleteHistory(
    @Param('id') id: string,
    @Param('historyId') historyId: string
  ): Promise<void> {
    await this.businessService.deleteHistory(historyId);
  }

  @Put(':id/registerLicense')
  // @Roles('Admin')
  async registerLicense(
    @Param('id') id: string,
    @Body('license_id') license_id: string,
  ): Promise<Business> {
    return this.businessService.registerLicense(parseInt(id, 10), license_id);
  }
}