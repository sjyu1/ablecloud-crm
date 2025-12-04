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
      enablelist?: string;
    }
  ): Promise<{ data: Product[]; pagination: {} }> {
    const offset = (currentPage - 1) * itemsPerPage;
  
    // 필터 조건
    const whereConditions: string[] = ['p.removed IS NULL'];
    const params: any[] = [];

    if (filters.name) {
      whereConditions.push('p.name LIKE ?');
      params.push(`%${filters.name}%`);
    }

    // 파트너 회사 ID 기준 product_category 필터
    if (filters.company_id) {
      whereConditions.push(`
        EXISTS (
          SELECT 1
          FROM partner pt
          WHERE pt.id = ?
            AND pt.removed IS NULL
            AND FIND_IN_SET(p.category_id, pt.product_category)
        )
      `);
      params.push(filters.company_id);
    }
  
    // 제품 모두보기 아닐경우
    if (!filters.enablelist) {
      whereConditions.push('p.enabled = true');
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
  
    // Step 1: 전체 개수 조회
    const countQuery = `
      SELECT COUNT(*) AS count
      FROM product p
      LEFT JOIN product_category pc ON p.category_id = pc.id
      ${whereClause}
    `;
    const countResult = await this.productRepository.query(countQuery, params);
    const totalItems = countResult[0]?.count || 0;
  
    // Step 2: 데이터가 없으면 빈 배열 반환
    if (totalItems === 0) {
      return {
        data: [],
        pagination: {
          currentPage,
          totalItems,
          totalPages: 0,
          itemsPerPage,
        },
      };
    }
  
    // Step 3: 데이터 조회
    const dataQuery = `
      SELECT 
        p.id AS id,
        p.category_id AS category_id,
        p.name AS name,
        p.version AS version,
        p.isoFilePath AS isoFilePath,
        p.checksum AS checksum,
        p.enabled AS enabled,
        -- p.contents AS contents,
        p.created AS created,
        pc.name AS category_name
      FROM product p
      LEFT JOIN product_category pc ON p.category_id = pc.id
      ${whereClause}
      ORDER BY p.created DESC
      LIMIT ? OFFSET ?
    `;
  
    const result = await this.productRepository.query(dataQuery, [...params, itemsPerPage, offset]);
  
    return {
      data: result,
      pagination: {
        currentPage,
        totalItems,
        totalPages: Math.ceil(totalItems / itemsPerPage),
        itemsPerPage,
      },
    };
  }

  async findOne(id: number): Promise<{ data: Product | null }> {
    const rawQuery = `
      SELECT 
        p.id AS id,
        p.category_id AS category_id,
        p.name AS name,
        p.version AS version,
        p.isoFilePath AS isoFilePath,
        p.checksum AS checksum,
        -- p.contents AS contents,
        p.enabled AS enabled,
        p.created AS created,
        pc.name AS category_name
      FROM product p
      LEFT JOIN product_category pc ON p.category_id = pc.id
      WHERE p.removed IS NULL
        -- AND p.enabled = TRUE
        AND p.id = ?
    `;
  
    const [product] = await this.productRepository.query(rawQuery, [id]);
  
    return { data: product || null };
  }
  
  async findOneRelease(id: number): Promise<{ data: Product | null }> {
    const rawQuery = `
      SELECT 
        p.id AS id,
        p.contents AS contents
      FROM product p
      WHERE p.id = ?
    `;
  
    const [product] = await this.productRepository.query(rawQuery, [id]);
  
    return { data: product || null };
  }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    createProductDto.enabled = true;
    const product = this.productRepository.create(createProductDto);
    return this.productRepository.save(product);
  }
  
  async update(id: number, updateProductDto: UpdateProductDto): Promise<Product> {
    const { data: existingProduct } = await this.findOne(id);
  
    if (!existingProduct) {
      throw new Error(`Product with ID ${id} not found`);
    }
  
    const updatedProduct = this.productRepository.merge(existingProduct, updateProductDto);
    return this.productRepository.save(updatedProduct);
  }
  
  async updateRelease(id: number, contents: string): Promise<Product> {
    return this.update(id, { contents }); 
  }

  async delete(id: number): Promise<void> {
    await this.productRepository.softDelete(id);
  }
  
  async disabledProduct(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new Error(`Product with ID ${id} not found`);
    }
  
    product.enabled = false;
    return this.productRepository.save(product);
  }
  
  async enabledProduct(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new Error(`Product with ID ${id} not found`);
    }
  
    product.enabled = true;
    return this.productRepository.save(product);
  }
  
  async findAllCategory(
    filters: { name?: string }
  ): Promise<{ data: Product[] }> {
    const dataQuery = this.product_categoryRepository
      .createQueryBuilder('product_category')
      .select([
        'product_category.id AS id',
        'product_category.name AS name',
        'product_category.enabled AS enabled',
        'product_category.created AS created',
      ])
      .where('product_category.enabled = true')
      .andWhere('product_category.removed IS NULL')
      .orderBy('product_category.created', 'DESC');
  
    if (filters.name) {
      dataQuery.andWhere('product_category.name LIKE :name', {
        name: `%${filters.name}%`,
      });
    }
  
    const data = await dataQuery.getRawMany();
    return { data };
  }
}
