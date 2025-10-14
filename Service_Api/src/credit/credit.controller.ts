import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CreditService } from './credit.service';
import { Credit } from './credit.entity';
import { CreateCreditDto, UpdateCreditDto } from './dto/credit.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/role/role.guard';

@UseGuards(AuthGuard, RolesGuard)
@Controller('credit')
export class CreditController {
  constructor(private readonly creditService: CreditService) {}

  @Get()
  // @Roles('Admin')
  async findAll(
    @Query('page') currentPage = '1',
    @Query('limit') itemsPerPage = '10',
    @Query('type') type?: string,
    @Query('partner') partner?: string,
    @Query('business') business?: string,
    @Query('company_id') company_id?: string,
  ): Promise<{ data: Credit[]; pagination: {} }> {
    const filters = {
      type: type || '',
      partner: partner || '',
      business: business || '',
      company_id: company_id || '',
    };

    return this.creditService.findAll(parseInt(currentPage, 10), parseInt(itemsPerPage, 10), filters);
  }

  @Get(':id')
  // @Roles('Admin')
  async findOne(@Param('id') id: string): Promise<{ data: Credit; }> {
    return this.creditService.findOne(parseInt(id, 10));
  }

  @Post()
  // @Roles('Admin')
  async create(@Body() createCreditDto: CreateCreditDto): Promise<Credit> {
    return this.creditService.create(createCreditDto);
  }

  @Put(':id')
  // @Roles('Admin')
  async update(
    @Param('id') id: string,
    @Body() updateCreditDto: UpdateCreditDto
  ): Promise<Credit> {
    return this.creditService.update(parseInt(id, 10), updateCreditDto);
  }

  @Delete(':id')
  // @Roles('Admin')
  async delete(@Param('id') id: string): Promise<void> {
    return this.creditService.delete(parseInt(id, 10));
  }
}