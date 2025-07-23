import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Logger } from '@nestjs/common';
import { BusinessService } from './business.service';
import { Business } from './business.entity';
import { Business_history } from './business_history.entity';
import { CreateBusinessDto, UpdateBusinessDto, CreateBusiness_historyDto, UpdateBusiness_historyDto, CreateCreditDto, UpdateCreditDto } from './dto/business.dto';
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
    @Query('manager_company') manager_company?: string,
    @Query('customer_name') customer_name?: string,
    @Query('status') status?: string,
    @Query('available') available?: string,
    @Query('company_id') company_id?: string,
    @Query('customer_id') customer_id?: string
  ): Promise<{ items: Business[]; currentPage: number; totalItems: number; totalPages: number }> {
    const filters = {
      name: name || '',
      manager_company: manager_company || '',
      customer_name: customer_name || '',
      status: status || '',
      available: available || '',
      company_id: company_id || '',
      customer_id: customer_id || ''
    };

    return this.businessService.findAll(parseInt(currentPage, 10), parseInt(itemsPerPage, 10), filters);
  }

  @Get(':id/history')
  // @Roles('Admin')
  async findAllHistory
    (@Param('id') id: string): Promise<Business_history[]> {
    return this.businessService.findAllHistory(parseInt(id, 10));
  }

  @Get(':id/history/:historyId')
  // @Roles('Admin')
  async findOneHistory(
    @Param('id') id: string, 
    @Param('historyId') historyId: string
  ): Promise<Business_history> {
    return this.businessService.findOneHistory(parseInt(id, 10), historyId);
  }

  @Get(':id')
  // @Roles('Admin')
  async findOne(@Param('id') id: string): Promise<Business> {
    return this.businessService.findOne(parseInt(id, 10));
  }

  @Post()
  // @Roles('Admin')
  async create(@Body() createBusinessDto: CreateBusinessDto, createCreditDto: CreateCreditDto): Promise<Business> {
    return this.businessService.create(createBusinessDto, createCreditDto);
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
    @Body() updateBusinessDto: UpdateBusinessDto, updateCreditDto: UpdateCreditDto
  ): Promise<Business> {
    return this.businessService.update(parseInt(id, 10), updateBusinessDto, updateCreditDto);
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