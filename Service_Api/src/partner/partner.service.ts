import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Partner } from './partner.entity';
import { CreatePartnerDto, UpdatePartnerDto } from './dto/partner.dto';

@Injectable()
export class PartnerService {
  constructor(
    @InjectRepository(Partner)
    private readonly partnerRepository: Repository<Partner>,
  ) {}

  async findAll(
    currentPage: number = 1,
    itemsPerPage: number = 10,
    filters: {
      id?: string;
      name?: string;
      level?: string;
      order?: string;
    }
  ): Promise<{ data: Partner[]; pagination: {}  }> {
    const offset = (currentPage - 1) * itemsPerPage;
  
    // 필터 조건
    const whereConditions: string[] = ['p.removed IS NULL'];
    const params: any[] = [];
  
    if (filters.id) {
      whereConditions.push('p.id = ?');
      params.push(filters.id);
    }
  
    if (filters.name) {
      whereConditions.push('p.name LIKE ?');
      params.push(`%${filters.name}%`);
    }
  
    if (filters.level) {
      whereConditions.push('p.level = ?');
      params.push(filters.level);
    }
  
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // ORDER BY 처리
    const orderByClause = filters.order ? 'ORDER BY p.name ASC' : 'ORDER BY p.created DESC';
  
    // Step 1: 전체 개수 조회
    const countQuery = `
      SELECT COUNT(*) AS count
      FROM partner p
      ${whereClause}
    `;
    const countResult = await this.partnerRepository.query(countQuery, params);
    const totalItems = Number(countResult[0]?.count || 0);
  
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
  
    // Step 3: 실제 데이터 조회
    const dataQuery = `
      SELECT
        p.id AS id,
        p.name AS name,
        p.telnum AS telnum,
        p.level AS level,
        p.created AS created
      FROM partner p
      ${whereClause}
      ${orderByClause}
      LIMIT ? OFFSET ?
    `;

    const result = await this.partnerRepository.query(dataQuery, [...params, itemsPerPage, offset]);

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

  async findOne(id: number): Promise<{ data: Partner | null }> {
    const rawQuery = `
      SELECT 
        p.id,
        p.name,
        p.level,
        p.telnum,
        p.created,
        p.product_category,
        GROUP_CONCAT(pc.name ORDER BY pc.id) AS product_category_names,
        MAX(cr.deposit) AS deposit,
        MAX(cr.credit) AS credit
      FROM partner p
      LEFT JOIN product_category pc 
        ON FIND_IN_SET(pc.id, p.product_category)
      LEFT JOIN (
        SELECT 
          partner_id, 
          SUM(deposit) AS deposit, 
          SUM(credit) AS credit
        FROM credit
        WHERE removed IS NULL
        GROUP BY partner_id
      ) cr ON p.id = cr.partner_id
      WHERE p.id = ?
        AND p.removed IS NULL
      GROUP BY p.id
      LIMIT 1
    `;

    const [partner] = await this.partnerRepository.query(rawQuery, [id]);

    return {
      data: partner || null,
    };
  }

  async create(createPartnerDto: CreatePartnerDto): Promise<Partner> {
    const partner = this.partnerRepository.create(createPartnerDto);
    return await this.partnerRepository.save(partner);
  }

  async update(id: number, updatePartnerDto: UpdatePartnerDto): Promise<Partner> {
    const partner = await this.findOne(id);
    const updatedPartner = {
      ...partner,
      ...updatePartnerDto,
    };
    return this.partnerRepository.save(updatedPartner);
  }

  async delete(id: number): Promise<void> {
    await this.partnerRepository.softDelete(id);
  }
}