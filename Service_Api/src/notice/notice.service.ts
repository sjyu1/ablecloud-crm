import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notice } from './notice.entity';
import { CreateNoticeDto, UpdateNoticeDto } from './dto/notice.dto';

@Injectable()
export class NoticeService {
  constructor(
    @InjectRepository(Notice)
    private readonly noticeRepository: Repository<Notice>
  ) { }

  async findAll(
    currentPage: number = 1,
    itemsPerPage: number = 10,
    filters: {
      title?: string;
      level?: string;
      company_id?: string;
    }
  ): Promise<{ items: Notice[]; currentPage: number; totalItems: number; totalPages: number }> {
    const offset = (currentPage - 1) * itemsPerPage;

    const whereConditions: string[] = ['n.removed IS NULL'];
    const params: any[] = [];

    if (filters.title) {
      whereConditions.push('n.title LIKE ?');
      params.push(`%${filters.title}%`);
    }

    if (filters.level) {
      whereConditions.push('n.level LIKE ?');
      params.push(`%${filters.level}%`);
    }

    const joinPartner = filters.company_id ? `JOIN partner p ON p.id = ?` : '';
    if (filters.company_id) {
      params.push(filters.company_id);
      // FIND_IN_SET 조건 추가 (partner.level이 notice.level에 포함되거나 notice.level에 'ALL' 포함)
      whereConditions.push(`(FIND_IN_SET(p.level, n.level) > 0 OR FIND_IN_SET('ALL', n.level) > 0)`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Step 1: total 데이터 조회
    const countQuery = `
      SELECT COUNT(*) as count
      FROM notice n
      ${joinPartner}
      ${whereClause}
    `;
    const countResult = await this.noticeRepository.query(countQuery, params);
    const totalItems = countResult[0]?.count || 0;

    if (totalItems === 0) {
      return { items: [], currentPage, totalItems, totalPages: 0 };
    }

    // Step 2: 데이터 조회
    const rawQuery = `
      SELECT 
        n.id as id,
        n.title as title,
        n.content as content,
        n.writer as writer,
        n.level as level,
        n.created as created
      FROM notice n
      ${joinPartner}
      ${whereClause}
      ORDER BY n.created DESC
      LIMIT ? OFFSET ?
    `;

    const data = await this.noticeRepository.query(rawQuery, [...params, itemsPerPage, offset]);

    return {
      items: data,
      currentPage,
      totalItems,
      totalPages: Math.ceil(totalItems / itemsPerPage),
    };
  }

  async findOne(id: number): Promise<Notice> {
    const rawQuery = `
      SELECT 
        n.id as id,
        n.title as title,
        n.content as content,
        n.writer as writer,
        n.level as level,
        n.created as created
      FROM notice n
      WHERE n.removed IS NULL
        AND n.id = ?
    `;

    const [notice] = await this.noticeRepository.query(rawQuery, [id]);

    if (!notice) return null;

    return {
      ...notice,
    };
  }

  async create(createNoticeDto: CreateNoticeDto): Promise<Notice> {
    const notice = this.noticeRepository.create(createNoticeDto);
    return this.noticeRepository.save(notice);
  }

  async update(id: number, updateNoticeDto: UpdateNoticeDto): Promise<Notice> {
    const notice = await this.findOne(id);
    const updatedNotice = {
      ...notice,
      ...updateNoticeDto,
    };
    return this.noticeRepository.save(updatedNotice);
  }

  async delete(id: number): Promise<void> {
    await this.noticeRepository.softDelete(id);
  }

}