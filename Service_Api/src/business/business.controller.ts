import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { BusinessService } from './business.service';
import { Business } from './business.entity';
import { CreateBusinessDto, UpdateBusinessDto } from './dto/business.dto';
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

  @Put(':id')
  // @Roles('Admin')
  async update(
    @Param('id') id: string,
    @Body() updateBusinessDto: UpdateBusinessDto
  ): Promise<Business> {
    return this.businessService.update(parseInt(id, 10), updateBusinessDto);
  }

  @Delete(':id')
  // @Roles('Admin')
  async delete(@Param('id') id: string): Promise<void> {
    return this.businessService.delete(parseInt(id, 10));
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