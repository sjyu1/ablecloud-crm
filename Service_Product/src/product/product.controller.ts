import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ProductService } from './product.service';
import { Product } from './product.entity';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/role/role.guard';
// import { Roles } from 'src/auth/role/role.decorator';

@UseGuards(AuthGuard, RolesGuard)
@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  // @Roles('Admin')
  async create(@Body() createProductDto: CreateProductDto): Promise<Product> {
    return this.productService.create(createProductDto);
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

    const { products, total } = await this.productService.findAll(
      parsedPage,
      parsedLimit,
      name
    );

    return {
      data: products,
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
  async findOne(@Param('id') id: string): Promise<Product> {
    return this.productService.findOne(parseInt(id, 10));
  }

  @Put(':id')
  // @Roles('Admin')
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto
  ): Promise<Product> {
    return this.productService.update(parseInt(id, 10), updateProductDto);
  }

  @Delete(':id')
  // @Roles('Admin')
  async remove(@Param('id') id: string): Promise<void> {
    return this.productService.remove(parseInt(id, 10));
  }
}