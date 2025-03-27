import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { Customer } from './customer.entity';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/role/role.guard';
// import { Roles } from 'src/auth/role/role.decorator';

@UseGuards(AuthGuard, RolesGuard)
@Controller('customer')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  // @Roles('Admin')
  async create(@Body() createCustomerDto: CreateCustomerDto): Promise<Customer> {
    return this.customerService.create(createCustomerDto);
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

    const { customers, total } = await this.customerService.findAll(
      parsedPage,
      parsedLimit,
      name
    );

    return {
      data: customers,
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
  async findOne(@Param('id') id: string): Promise<Customer> {
    return this.customerService.findOne(parseInt(id, 10));
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
  async remove(@Param('id') id: string): Promise<void> {
    return this.customerService.remove(parseInt(id, 10));
  }
}