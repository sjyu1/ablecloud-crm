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
    @Query('name') name?: string
  ) {
    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);

    const { businesses, total } = await this.businessService.findAll(
      parsedPage,
      parsedLimit,
      name
    );

    return {
      data: businesses,
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
  async findOne(@Param('id') id: string): Promise<Business> {
    return this.businessService.findOne(parseInt(id, 10));
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
}