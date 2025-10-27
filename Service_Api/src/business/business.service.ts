import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from './business.entity';
import { Credit } from '../credit/credit.entity';
import { CreateBusinessDto, UpdateBusinessDto, CreateCreditDto, UpdateCreditDto } from './dto/business.dto';

@Injectable()
export class BusinessService {
  constructor(
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    @InjectRepository(Credit)
    private readonly creditRepository: Repository<Credit>
  ) {}

  async findAll(
    currentPage: number = 1,
    itemsPerPage: number = 10,
    filters: {
      name?: string;
      manager_company?: string;
      customer_name?: string;
      status?: string;
      available?: string;
      company_id?: string;
      customer_id?: string;
      order?: string;
    }
  ): Promise<{ data: Business[]; pagination: {} }> {
    const offset = (currentPage - 1) * itemsPerPage;
  
    // 필터 조건
    const whereConditions: string[] = ['b.removed IS NULL'];
    const params: any[] = [];
  
    if (filters.name) {
      whereConditions.push('b.name LIKE ?');
      params.push(`%${filters.name}%`);
    }
  
    if (filters.manager_company) {
      if (filters.manager_company === 'ABLECLOUD') {
        whereConditions.push('(ut.type IS NULL OR ut.type != "partner")');
      } else {
        whereConditions.push('ut.type = "partner" AND partner.name LIKE ?');
        params.push(`%${filters.manager_company}%`);
      }
    }
  
    if (filters.customer_name) {
      whereConditions.push('c.name LIKE ?');
      params.push(`%${filters.customer_name}%`);
    }
  
    if (filters.status) {
      whereConditions.push('b.status = ?');
      params.push(filters.status);
    }
  
    if (filters.available) {
      whereConditions.push('b.license_id IS NULL');
    }
  
    if (filters.company_id) {
      whereConditions.push('uc.company_id = ?');
      params.push(filters.company_id);
    }
  
    if (filters.customer_id) {
      whereConditions.push('b.customer_id = ?');
      params.push(filters.customer_id);
    }
  
    const whereClause = whereConditions.length ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // ORDER BY 처리
    const orderByClause = filters.order ? 'ORDER BY b.name ASC' : 'ORDER BY b.created DESC';
  
    // Step 1: 전체 개수 조회
    const countQuery = `
      WITH user_company AS (
        SELECT user_id, value AS company_id
        FROM keycloak.USER_ATTRIBUTE
        WHERE name = 'company_id'
      ),
      user_type AS (
        SELECT user_id, value AS type
        FROM keycloak.USER_ATTRIBUTE
        WHERE name = 'type'
          AND value IN ('partner', 'vendor')
      )
      SELECT COUNT(DISTINCT b.id) AS count
      FROM business b
      LEFT JOIN customer c ON b.customer_id = c.id
      LEFT JOIN product p ON b.product_id = p.id
      LEFT JOIN keycloak.USER_ENTITY u ON b.manager_id = u.id
      LEFT JOIN user_company uc ON u.id = uc.user_id
      LEFT JOIN user_type ut ON u.id = ut.user_id
      LEFT JOIN partner ON uc.company_id = CAST(partner.id AS CHAR)
      ${whereClause}
    `;
    const countResult = await this.businessRepository.query(countQuery, params);
    const totalItems = parseInt(countResult[0]?.count || '0', 10);
  
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
      WITH user_company AS (
        SELECT user_id, value AS company_id
        FROM keycloak.USER_ATTRIBUTE
        WHERE name = 'company_id'
      ),
      user_type AS (
        SELECT user_id, value AS type
        FROM keycloak.USER_ATTRIBUTE
        WHERE name = 'type'
          AND value IN ('partner', 'vendor')
      )
      SELECT
        b.id,
        b.name,
        b.issued,
        b.expired,
        b.license_id,
        b.customer_id,
        b.status,
        b.core_cnt,
        b.node_cnt,
        b.manager_id,
        b.product_id,
        b.details,
        b.created,
        c.name AS customer_name,
        p.name AS product_name,
        p.version AS product_version,
        u.username AS manager_name,
        partner.id AS manager_company_id,
        CASE
          WHEN ut.type = 'partner' THEN partner.name
          ELSE 'ABLECLOUD'
        END AS manager_company
      FROM business b
      LEFT JOIN customer c ON b.customer_id = c.id
      LEFT JOIN product p ON b.product_id = p.id
      LEFT JOIN keycloak.USER_ENTITY u ON b.manager_id = u.id
      LEFT JOIN user_company uc ON u.id = uc.user_id
      LEFT JOIN user_type ut ON u.id = ut.user_id
      LEFT JOIN partner ON uc.company_id = CAST(partner.id AS CHAR)
      ${whereClause}
      ${orderByClause}
      LIMIT ? OFFSET ?
    `;

    const result = await this.businessRepository.query(dataQuery, [...params, itemsPerPage, offset]);
  
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

  async findOne(id: number): Promise<{ data: Business | null }> {
    const rawQuery = `
      WITH user_company AS (
        SELECT user_id, value AS company_id
        FROM keycloak.USER_ATTRIBUTE
        WHERE name = 'company_id'
      ),
      user_type AS (
        SELECT user_id, value AS type
        FROM keycloak.USER_ATTRIBUTE
        WHERE name = 'type' AND value IN ('partner', 'vendor')
      ),
      credit_summary AS (
        SELECT partner_id, SUM(deposit) AS deposit, SUM(credit) AS credit
        FROM credit
        WHERE removed IS NULL
        GROUP BY partner_id
      ),
      valid_license AS (
        SELECT id, license_key, status, issued, expired, trial
        FROM license
        WHERE removed IS NULL
      )
      SELECT
        b.id, b.name, b.issued, b.expired, b.license_id, b.customer_id, b.status,
        b.core_cnt, b.node_cnt, b.manager_id, b.product_id, b.details, b.deposit_use, b.created,
        c.name AS customer_name,
        p.name AS product_name, p.version AS product_version,
        l.license_key, l.status AS license_status, l.issued AS license_issued,
        l.expired AS license_expired, l.trial AS license_trial,
        u.username AS manager_name,
        CASE WHEN ut.type = 'partner' THEN partner.name ELSE 'ABLECLOUD' END AS manager_company,
        cr.deposit, cr.credit, credit.id AS credit_id, partner.id AS partner_id
      FROM business b
      LEFT JOIN customer c ON b.customer_id = c.id
      LEFT JOIN product p ON b.product_id = p.id
      LEFT JOIN valid_license l ON b.license_id = l.id
      LEFT JOIN keycloak.USER_ENTITY u ON b.manager_id = u.id
      LEFT JOIN user_company uc ON u.id = uc.user_id
      LEFT JOIN user_type ut ON u.id = ut.user_id
      LEFT JOIN partner ON uc.company_id = CAST(partner.id AS CHAR)
      LEFT JOIN credit ON b.id = credit.business_id
      LEFT JOIN credit_summary cr ON partner.id = cr.partner_id
      WHERE uc.user_id IS NOT NULL
        AND ut.user_id IS NOT NULL
        AND b.id = ?
    `;
  
    const [business] = await this.businessRepository.query(rawQuery, [id]);
  
    return { data: business || null };
  }
  
  async create(createBusinessDto: CreateBusinessDto, createCreditDto: CreateCreditDto): Promise<Business> {
    const business = this.businessRepository.create(createBusinessDto);
    await this.businessRepository.save(business);
  
    if (createBusinessDto.deposit_use) {
      const credit = this.creditRepository.create({
        ...createCreditDto,
        business_id: business.id,
        partner_id: createBusinessDto.partner_id,
        credit: createBusinessDto.core_cnt,
      });
      await this.creditRepository.save(credit);
    }
  
    return business;
  }
  
  async update(
    id: number,
    updateBusinessDto: UpdateBusinessDto,
    updateCreditDto: UpdateCreditDto
  ): Promise<Business | null> {
    const { data: existingBusiness } = await this.findOne(id);
  
    if (!existingBusiness) {
      return null;
    }
  
    const updatedBusiness = this.businessRepository.create({
      ...existingBusiness,
      ...updateBusinessDto,
    });
    await this.businessRepository.save(updatedBusiness);
  
    if (updateBusinessDto.deposit_use) {
      const credit = this.creditRepository.create({
        ...updateCreditDto,
        id: updateBusinessDto.credit_id,
        partner_id: existingBusiness.partner_id,
        business_id: existingBusiness.id,
        credit: updateBusinessDto.core_cnt,
      });
      await this.creditRepository.save(credit);
    } else if (updateBusinessDto.credit_id) {
      await this.creditRepository.softDelete(updateBusinessDto.credit_id);
    }
  
    return updatedBusiness;
  }
  
  async delete(id: number): Promise<void> {
    const { data: business } = await this.findOne(id);
  
    if (!business) {
      throw new Error(`Business with ID ${id} not found`);
    }
  
    business.license_id = null;
    await this.businessRepository.save(business);
  
    if (business.deposit_use) {
      await this.creditRepository
        .createQueryBuilder()
        .softDelete()
        .where('business_id = :id', { id })
        .execute();
    }
  
    await this.businessRepository.softDelete(id);
  }
  
  async registerLicense(id: number, license_id: string): Promise<Business> {
    const business = await this.businessRepository.findOne({ where: { id } });
  
    if (!business) {
      throw new Error(`Business with ID ${id} not found`);
    }
  
    business.license_id = license_id;
    const savedBusiness = await this.businessRepository.save(business);
  
    // Date 타입으로 변환
    const updatedDate = new Date(this.removeMicrosecondsFromTimestamp(savedBusiness.updated));
  
    return {
      ...savedBusiness,
      updated: updatedDate,
    } as Business;
  }
  
  private removeMicrosecondsFromTimestamp(timestamp: string | Date): string {
    return new Date(timestamp).toISOString().replace(/\.\d{3}Z$/, 'Z');
  }
  
}