import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async findAll(
    currentPage: number = 1,
    itemsPerPage: number = 10,
    filters: {
      name?: string;
    }
  ): Promise<{ items: Product[]; currentPage: number; totalItems: number; totalPages: number }> {
    // Step 1: ID만 추출
    const subQuery = this.productRepository.createQueryBuilder('product')
      .select('product.id', 'id')
      .andWhere('product.enabled = true')
      .andWhere('product.removed is null')
      .orderBy('product.created', 'DESC');

    if (filters.name) {
      subQuery.andWhere('product.name LIKE :name', { name: `%${filters.name}%` });
    }

    const totalItems = await subQuery.getCount();

    const ids = await subQuery
      .skip((currentPage - 1) * itemsPerPage)
      .take(itemsPerPage)
      .getRawMany();

    const productIds = ids.map(item => item.product_id || item.id);
    if (productIds.length === 0) {
      return { items: [], currentPage, totalItems, totalPages: 0 };
    }

    // Step 2: ID 기준 상세 데이터 조회
    const data = await this.productRepository
      .createQueryBuilder('product')
      .select([
        'product.id as id',
        'product.name as name',
        'product.version as version',
        'product.isoFilePath as isoFilePath',
        'product.enabled as enabled',
        'product.contents as contents',
        'product.created as created',
      ])
      .whereInIds(productIds)
      .orderBy('product.created', 'DESC')
      .getRawMany();

    return {
      items: data,
      currentPage,
      totalItems,
      totalPages: Math.ceil(totalItems / itemsPerPage),
    };
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      withDeleted: false
    });

    if (!product) {
      throw new NotFoundException(`제품 ID ${id}를 찾을 수 없습니다.`);
    }

    return product;
  }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    createProductDto.enabled = true;
    const product = this.productRepository.create(createProductDto);
    return this.productRepository.save(product);
  }

  async update(id: number, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    const updatedProduct = {
      ...product,
      ...updateProductDto,
    };
    return this.productRepository.save(updatedProduct);
  }

  async delete(id: number): Promise<void> {
    await this.productRepository.softDelete(id);
  }

  async disabledProduct(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new Error(`product with ID ${id} not found`);
    }
    product.enabled = false;

    const savedProduct = await this.productRepository.save(product);
    const formattedProduct = {
      ...savedProduct,
    };

    return formattedProduct as unknown as Product;
  }
}