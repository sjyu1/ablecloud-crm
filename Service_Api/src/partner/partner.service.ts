import { Injectable, NotFoundException } from '@nestjs/common';
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
  ): Promise<{ items: Partner[]; currentPage: number; totalItems: number; totalPages: number }> {
    const offset = (currentPage - 1) * itemsPerPage;
  
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
  
    const countQuery = `
      SELECT COUNT(*) AS count
      FROM partner p
      ${whereClause}
    `;
    const countResult = await this.partnerRepository.query(countQuery, params);
    const totalItems = Number(countResult[0]?.count || 0);
  
    if (totalItems === 0) {
      return {
        items: [],
        currentPage,
        totalItems,
        totalPages: 0,
      };
    }
  
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
  
    const data = await this.partnerRepository.query(dataQuery, [...params, itemsPerPage, offset]);
  
    return {
      items: data,
      currentPage,
      totalItems,
      totalPages: Math.ceil(totalItems / itemsPerPage),
    };
  }

  async findOne(id: number): Promise<Partner | null> {
    const rawQuery = `
      SELECT 
        p.id AS id,
        p.name AS name,
        p.level AS level,
        p.telnum AS telnum,
        p.created AS created,
        p.product_category AS product_category,
        GROUP_CONCAT(pc.name ORDER BY pc.id) AS product_category_names,
        ANY_VALUE(cr.deposit) AS deposit,
        ANY_VALUE(cr.credit) AS credit
      FROM partner p
      LEFT JOIN product_category pc 
        ON FIND_IN_SET(pc.id, p.product_category)
      LEFT JOIN (
        SELECT partner_id, SUM(deposit) AS deposit, SUM(credit) AS credit
        FROM credit
        WHERE removed IS NULL
        GROUP BY partner_id
      ) cr ON p.id = cr.partner_id
      WHERE p.id = ?
        AND p.removed IS NULL
      GROUP BY p.id
    `;

    const [partner] = await this.partnerRepository.query(rawQuery, [id]);

    if (!partner) throw new NotFoundException(`파트너 ID ${id}를 찾을 수 없습니다.`);

    return {
      ...partner,
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