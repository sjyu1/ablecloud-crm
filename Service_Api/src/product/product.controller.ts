import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ProductService } from './product.service';
import { Product } from './product.entity';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/role/role.guard';

@UseGuards(AuthGuard, RolesGuard)
@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  // @Roles('Admin')
  async findAll(
    @Query('page') currentPage = '1',
    @Query('limit') itemsPerPage = '10',
    @Query('name') name?: string,
    @Query('company_id') company_id?: string,
    @Query('enablelist') enablelist?: string
  ): Promise<{data: Product[]; pagination: {} }> {
    const filters = {
      name: name || '',
      company_id: company_id || '',
      enablelist: enablelist || ''
    };

    return this.productService.findAll(parseInt(currentPage, 10), parseInt(itemsPerPage, 10), filters);
  }

  @Get('category')
  // @Roles('Admin')
  async findAllCategory(
    @Query('name') name?: string
  ): Promise<{ data: Product[]; }> {
    const filters = {
      name: name || ''
    };

    return this.productService.findAllCategory(filters);
  }

  @Get(':id')
  // @Roles('Admin')
  async findOne(@Param('id') id: string): Promise<{ data: Product | null }> {
    return this.productService.findOne(parseInt(id, 10));
  }

  @Get(':id/release')
  // @Roles('Admin')
  async findOneRelease(@Param('id') id: string): Promise<{ data: Product | null }> {
    return this.productService.findOneRelease(parseInt(id, 10));
  }

  @Post()
  // @Roles('Admin')
  async create(@Body() createProductDto: CreateProductDto): Promise<Product> {
    return this.productService.create(createProductDto);
  }

  @Put(':id')
  // @Roles('Admin')
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto
  ): Promise<Product> {
    return this.productService.update(parseInt(id, 10), updateProductDto);
  }

  @Put(':id/release')
  // @Roles('Admin')
  async updateRelease(
    @Param('id') id: string,
    @Body('contents') contents: string
  ): Promise<Product> {
    return this.productService.updateRelease(parseInt(id, 10), contents);
  }

  @Delete(':id')
  // @Roles('Admin')
  async delete(@Param('id') id: string): Promise<void> {
    return this.productService.delete(parseInt(id, 10));
  }

  @Put(':id/disabled')
  // @Roles('Admin')
  async disabledProduct(
    @Param('id') id: string,
  ): Promise<Product> {
    return this.productService.disabledProduct(parseInt(id, 10));
  }

  @Put(':id/enabled')
  // @Roles('Admin')
  async enabledProduct(
    @Param('id') id: string,
  ): Promise<Product> {
    return this.productService.enabledProduct(parseInt(id, 10));
  }
}
