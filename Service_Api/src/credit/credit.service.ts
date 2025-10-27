import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Credit } from './credit.entity';
import { CreateCreditDto, UpdateCreditDto } from './dto/credit.dto';

@Injectable()
export class CreditService {
  constructor(
    @InjectRepository(Credit)
    private readonly creditRepository: Repository<Credit>
  ) {}

  async findAll(
    currentPage: number = 1,
    itemsPerPage: number = 10,
    filters: {
      type?: string;
      partner?: string;
      business?: string;
      company_id?: string;
    }
  ): Promise<{ data: Credit[]; pagination: {} }> {
    const offset = (currentPage - 1) * itemsPerPage;
  
    // 필터 조건
    const whereConditions: string[] = ['c.removed IS NULL'];
    const params: any[] = [];

    if (filters.type) {
      if (filters.type == 'deposit') whereConditions.push('c.deposit IS NOT NULL');
      else  whereConditions.push('c.credit IS NOT NULL');
    }

    if (filters.partner) {
      whereConditions.push('p.name LIKE ?');
      params.push(`%${filters.partner}%`);
    }

    if (filters.business) {
      whereConditions.push('b.name LIKE ?');
      params.push(`%${filters.business}%`);
    }

    if (filters.company_id) {
      whereConditions.push(`c.partner_id = ?`);
      params.push(filters.company_id);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Step 1: 전체 개수 조회
    const countQuery = `
      SELECT COUNT(*) as count
      FROM credit c
      LEFT JOIN partner p ON c.partner_id = p.id
      LEFT JOIN business b ON c.business_id = b.id
      ${whereClause}
    `;
    const countResult = await this.creditRepository.query(countQuery, params);
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
    const rawQuery = `
      SELECT 
        c.id as id,
        c.deposit as deposit,
        c.credit as credit,
        c.note as note,
        c.created as created,
        p.id as partner_id,
        p.name as partner,
        b.id as business_id,
        b.name as business
      FROM credit c
      LEFT JOIN partner p ON c.partner_id = p.id
      LEFT JOIN business b ON c.business_id = b.id
      ${whereClause}
      ORDER BY c.created DESC
      LIMIT ? OFFSET ?
    `;

    const result = await this.creditRepository.query(rawQuery, [...params, itemsPerPage, offset]);

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

  async findOne(id: number): Promise<{ data: Credit | null }> {
    const rawQuery = `
      SELECT 
        c.id AS id,
        c.partner_id AS partner_id,
        c.business_id AS business_id,
        c.deposit AS deposit,
        c.credit AS credit,
        c.note AS note,
        c.created AS created,
        p.name as partner,
        b.name as business,
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM credit c2 
            WHERE c2.partner_id = c.partner_id 
              AND c2.removed IS NULL 
              AND c2.id != c.id
          ) THEN '1'
          ELSE '0'
        END AS deposit_use
      FROM credit c
      LEFT JOIN partner p ON c.partner_id = p.id
      LEFT JOIN business b ON c.business_id = b.id
      WHERE c.removed IS NULL
        AND c.id = ?
    `;

    const [credit] = await this.creditRepository.query(rawQuery, [id]);
  
    return { data: credit || null };
  }

  async create(createCreditDto: CreateCreditDto): Promise<Credit> {
    const credit = this.creditRepository.create(createCreditDto);
    return this.creditRepository.save(credit);
  }

  async update(id: number, updateCreditDto: UpdateCreditDto): Promise<Credit> {
    const credit = await this.findOne(id);
    const updatedCredit = {
      ...credit,
      ...updateCreditDto,
    };
    return this.creditRepository.save(updatedCredit);
  }

  async delete(id: number): Promise<void> {
    await this.creditRepository.softDelete(id);
  }

}