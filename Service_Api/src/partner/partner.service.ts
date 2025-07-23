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
    }
  ): Promise<{ items: Partner[]; currentPage: number; totalItems: number; totalPages: number }> {
    // Step 1: ID만 추출
    const subQuery = this.partnerRepository.createQueryBuilder('partner')
      .select('partner.id', 'id')
      .where('partner.removed IS NULL')
      .orderBy('partner.created', 'DESC');

    if (filters.id) {
      subQuery.andWhere('partner.id = :id', { id: filters.id });
    }

    if (filters.name) {
      subQuery.andWhere('partner.name LIKE :name', { name: `%${filters.name}%` });
    }

    if (filters.level) {
      subQuery.andWhere('partner.level = :level', { level: filters.level });
    }

    const totalItems = await subQuery.getCount();

    const ids = await subQuery
      .skip((currentPage - 1) * itemsPerPage)
      .take(itemsPerPage)
      .getRawMany();

    const partnerIds = ids.map(item => item.partner_id || item.id);
    if (partnerIds.length === 0) {
      return { items: [], currentPage, totalItems, totalPages: 0 };
    }

    // Step 2: ID 기준 상세 데이터 조회
    const data = await this.partnerRepository
      .createQueryBuilder('partner')
      .select([
        'partner.id as id',
        'partner.name as name',
        'partner.telnum as telnum',
        'partner.level as level',
        'partner.created as created',
      ])
      .whereInIds(partnerIds)
      .orderBy('partner.created', 'DESC')
      .getRawMany();

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