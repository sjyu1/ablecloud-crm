import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Support } from './support.entity';
import { CreateSupportDto, UpdateSupportDto } from './dto/support.dto';

@Injectable()
export class SupportService {
  constructor(
    @InjectRepository(Support)
    private readonly supportRepository: Repository<Support>
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
  ): Promise<{ data: Support[]; pagination: {} }> {
    const offset = (currentPage - 1) * itemsPerPage;
  
    // 필터 조건
    const whereConditions: string[] = ['s.removed IS NULL'];
    const params: any[] = [];

    if (filters.name) {
      whereConditions.push('c.name LIKE ?');
      params.push(`%${filters.name}%`);
    }

    if (filters.type) {
      whereConditions.push('s.type LIKE ?');
      params.push(`%${filters.type}%`);
    }

    if (filters.manager) {
      whereConditions.push('s.manager LIKE ?');
      params.push(`%${filters.manager}%`);
    }

    if (filters.status) {
      whereConditions.push('s.status = ?');
      params.push(filters.status);
    }

    if (filters.company_id) {
      whereConditions.push(`c.manager_company_id = ?`);
      params.push(filters.company_id);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Step 1: 전체 개수 조회
    const countQuery = `
      SELECT COUNT(*) as count
      FROM support s
      LEFT JOIN customer c ON s.customer_id = c.id
      ${whereClause}
    `;
    const countResult = await this.supportRepository.query(countQuery, params);
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
        s.id AS id,
        s.customer_id AS customer_id,
        s.type AS type,
        s.issue AS issue,
        s.manager AS manager,
        s.status AS status,
        s.issued AS issued,
        c.name AS customer
      FROM support s
      LEFT JOIN customer c ON s.customer_id = c.id
      ${whereClause}
      ORDER BY s.issued DESC
      LIMIT ? OFFSET ?
    `;

    const result = await this.supportRepository.query(rawQuery, [...params, itemsPerPage, offset]);

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

  async findOne(id: number): Promise<{ data: Support[]; }> {
    const rawQuery = `
      SELECT 
        s.id AS id,
        s.customer_id AS customer_id,
        s.business_id AS business_id,
        s.issued AS issued,
        s.type AS type,
        s.issue AS issue,
        s.solution AS solution,
        s.actioned AS actioned,
        s.action_type AS action_type,
        s.manager AS manager,
        s.status AS status,
        s.requester AS requester,
        s.requester_telnum AS requester_telnum,
        s.requester_email AS requester_email,
        s.note AS note,
        s.writer AS writer,
        c.name AS customer,
        b.name AS business
      FROM support s
      LEFT JOIN customer c ON s.customer_id = c.id
      LEFT JOIN business b ON s.business_id = b.id
      WHERE s.removed IS NULL
        AND s.id = ?
    `;

    const [support] = await this.supportRepository.query(rawQuery, [id]);

    return { data: support || null };
  }

  async create(createSupportDto: CreateSupportDto): Promise<Support> {
    const support = this.supportRepository.create(createSupportDto);
    return this.supportRepository.save(support);
  }

  async update(id: number, updateSupportDto: UpdateSupportDto): Promise<Support> {
    const support = await this.findOne(id);
    const updatedSupport = {
      ...support,
      ...updateSupportDto,
    };
    return this.supportRepository.save(updatedSupport);
  }

  async delete(id: number): Promise<void> {
    await this.supportRepository.softDelete(id);
  }

  private removeMicrosecondsFromTimestamp(timestamp: string | Date): string {
    const date = new Date(timestamp)
    return date.toISOString().replace(/\.\d{3}Z$/, 'Z')
  }
}