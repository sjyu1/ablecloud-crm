import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { Customer } from './customer.entity';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/role/role.guard';

@UseGuards(AuthGuard, RolesGuard)
@Controller('customer')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get()
  // @Roles('Admin')
  async findAll(
    @Query('page') currentPage = '1',
    @Query('limit') itemsPerPage = '10',
    @Query('name') name?: string,
    @Query('manager_company') manager_company?: string,
    @Query('company_id') company_id?: string,
    @Query('order') order?: string
  ): Promise<{ data: Customer[]; pagination: {} }> {
    const filters = {
      name: name || '',
      manager_company: manager_company || '',
      company_id: company_id || '',
      order: order || ''
    };

    return this.customerService.findAll(parseInt(currentPage, 10), parseInt(itemsPerPage, 10), filters);
  }

  @Get(':id')
  // @Roles('Admin')
  async findOne(@Param('id') id: string): Promise<{ data: Customer[]; }> {
    return this.customerService.findOne(parseInt(id, 10));
  }

  @Post()
  // @Roles('Admin')
  async create(@Body() createCustomerDto: CreateCustomerDto): Promise<Customer> {
    return this.customerService.create(createCustomerDto);
  }

  @Put(':id')
  // @Roles('Admin')
  async update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto
  ): Promise<Customer> {
    return this.customerService.update(parseInt(id, 10), updateCustomerDto);
  }

  @Delete(':id')
  // @Roles('Admin')
  async delete(@Param('id') id: string): Promise<void> {
    return this.customerService.delete(parseInt(id, 10));
  }
}