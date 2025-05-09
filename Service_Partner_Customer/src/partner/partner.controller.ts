import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { PartnerService } from './partner.service';
import { Partner } from './partner.entity';
import { CreatePartnerDto, UpdatePartnerDto } from './dto/partner.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/role/role.guard';
// import { Roles } from 'src/auth/role/role.decorator';

@UseGuards(AuthGuard, RolesGuard)
@Controller('partner')
export class PartnerController {
  constructor(private readonly partnerService: PartnerService) {}

  @Get()
  // @Roles('Admin')
  async findAll(
    @Query('page') currentPage = '1',
    @Query('limit') itemsPerPage = '10',
    @Query('name') name?: string,
    @Query('id') id?: string
  ): Promise<{ items: Partner[]; currentPage: number; totalItems: number; totalPages: number }> {
    const filters = {
      id: id || '',
      name: name || ''
    };

    return this.partnerService.findAll(parseInt(currentPage, 10), parseInt(itemsPerPage, 10), filters);
  }

  @Get(':id')
  // @Roles('Admin')
  async findOne(@Param('id') id: number) {
    return this.partnerService.findOne(id);
  }

  @Post()
  // @Roles('Admin')
  async create(@Body() createPartnerDto: CreatePartnerDto): Promise<Partner> {
    return this.partnerService.create(createPartnerDto);
  }

  @Put(':id')
  // @Roles('Admin')
  async update(
    @Param('id') id: string,
    @Body() updatePartnerDto: UpdatePartnerDto
  ): Promise<Partner> {
    return this.partnerService.update(parseInt(id, 10), updatePartnerDto);
  }

  @Delete(':id')
  // @Roles('Admin')
  async delete(@Param('id') id: string): Promise<void> {
    return this.partnerService.delete(parseInt(id, 10));
  }
}