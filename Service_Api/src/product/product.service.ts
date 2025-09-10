import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { Product_category } from './product_category.entity';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Product_category)
    private readonly product_categoryRepository: Repository<Product_category>,
  ) {}

  async findAll(
    currentPage: number = 1,
    itemsPerPage: number = 10,
    filters: {
      name?: string;
      type?: string;
      manager?: string;
      status?: string;
      company_id?: string;
    }
  ): Promise<{ items: Product[]; currentPage: number; totalItems: number; totalPages: number }> {
    const offset = (currentPage - 1) * itemsPerPage;

    const whereConditions: string[] = ['p.removed IS NULL'];
    const params: any[] = [];

    whereConditions.push('p.enabled = true');

    if (filters.name) {
      whereConditions.push('p.name LIKE ?');
      params.push(`%${filters.name}%`);
    }

    if (filters.company_id) {
      whereConditions.push(`FIND_IN_SET(p.category_id, (SELECT 
        p.product_category AS product_category
      FROM partner p
      LEFT JOIN product_category pc 
		    ON FIND_IN_SET(pc.id, p.product_category)
      WHERE p.id = ?
        AND p.removed is null
      GROUP BY p.id)) > 0`);
      params.push(filters.company_id);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Step 1: total 데이터 조회
    const countQuery = `
      SELECT COUNT(*) as count
      FROM product p
      LEFT JOIN product_category pc ON p.category_id = pc.id
      ${whereClause}
    `;
    const countResult = await this.productRepository.query(countQuery, params);
    const totalItems = countResult[0]?.count || 0;

    if (totalItems === 0) {
      return { items: [], currentPage, totalItems, totalPages: 0 };
    }

    // Step 2: 데이터 조회
    const rawQuery = `
      SELECT 
        p.id as id,
        p.category_id as category_id,
        p.name as name,
        p.version as version,
        p.isoFilePath as isoFilePath,
        p.checksum as checksum,
        p.enabled as enabled,
        p.contents as contents,
        p.created as created,
        pc.name as category_name
      FROM product p
      LEFT JOIN product_category pc ON p.category_id = pc.id
      ${whereClause}
      ORDER BY p.created DESC
      LIMIT ? OFFSET ?
    `;

    const data = await this.productRepository.query(rawQuery, [...params, itemsPerPage, offset]);

    return {
      items: data,
      currentPage,
      totalItems,
      totalPages: Math.ceil(totalItems / itemsPerPage),
    };
  }

  async findOne(id: number): Promise<Product> {
    const rawQuery = `
      SELECT 
        p.id as id,
        p.category_id as category_id,
        p.name as name,
        p.version as version,
        p.isoFilePath as isoFilePath,
        p.checksum as checksum,
        p.enabled as enabled,
        p.contents as contents,
        p.created as created,
        pc.name as category_name
      FROM product p
      LEFT JOIN product_category pc ON p.category_id = pc.id
      WHERE p.removed IS NULL 
        AND p.enabled = true
    `;

    const [product] = await this.productRepository.query(rawQuery, [id]);

    if (!product) return null;

    return {
      ...product,
    };
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

  async findAllCategory(
    filters: {
      name?: string;
    }
  ): Promise<{ items: Product[]; }> {
    // Step 1: ID만 추출
    const subQuery = this.product_categoryRepository.createQueryBuilder('product_category')
      .select('product_category.id', 'id')
      .andWhere('product_category.enabled = true')
      .andWhere('product_category.removed is null')
      .orderBy('product_category.created', 'DESC');

    if (filters.name) {
      subQuery.andWhere('product_category.name LIKE :name', { name: `%${filters.name}%` });
    }

    const totalItems = await subQuery.getCount();

    const ids = await subQuery
      .getRawMany();

    const productIds = ids.map(item => item.product_id || item.id);
    if (productIds.length === 0) {
      return { items: [] };
    }

    // Step 2: ID 기준 상세 데이터 조회
    const data = await this.product_categoryRepository
      .createQueryBuilder('product_category')
      .select([
        'product_category.id as id',
        'product_category.name as name',
        'product_category.enabled as enabled',
        'product_category.created as created',
      ])
      .whereInIds(productIds)
      // .orderBy('product_category.created', 'DESC')
      .getRawMany();

    return {
      items: data
    };
  }
}