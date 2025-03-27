import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { BusinessService } from './business.service';
import { Business } from './business.entity';
import { CreateBusinessDto, UpdateBusinessDto } from './dto/business.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/role/role.guard';
// import { Roles } from 'src/auth/role/role.decorator';

@UseGuards(AuthGuard, RolesGuard)
@Controller('business')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Post()
  // @Roles('Admin')
  async create(@Body() createBusinessDto: CreateBusinessDto): Promise<Business> {
    return this.businessService.create(createBusinessDto);
  }

  @Get()
  // @Roles('Admin')
  async findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('name') name?: string,
    @Query('available') available?: string,
  ) {
    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);
  
    const filters = {
      name: name || '',
      available: available || ''
    };

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    if (isNaN(pageNumber) || isNaN(limitNumber)) {
      throw new Error('Invalid page or limit format');
    }

    return this.businessService.findAll(parsedPage, parsedLimit, filters);
  }

  @Get(':id')
  // @Roles('Admin')
  async findOne(@Param('id') id: string): Promise<Business> {
    return this.businessService.getBusinessById(parseInt(id, 10));
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
  async remove(@Param('id') id: string): Promise<void> {
    return this.businessService.remove(parseInt(id, 10));
  }

  @Put(':id/registerLicense')
  // @Roles('Admin')
  async registerLicense(
    @Param('id') id: string,
    @Body('license_id') license_id: string,
  ): Promise<Business> {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) throw new Error('Invalid ID format');
    return this.businessService.registerLicense(numericId, license_id);
  }
}


