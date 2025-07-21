import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from './business.entity';
import { Credit } from '../credit/credit.entity';
import { Business_history } from './business_history.entity';
import { CreateBusinessDto, UpdateBusinessDto, CreateBusiness_historyDto, UpdateBusiness_historyDto, CreateCreditDto, UpdateCreditDto } from './dto/business.dto';

@Injectable()
export class BusinessService {
  constructor(
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    @InjectRepository(Business_history)
    private readonly business_historyRepository: Repository<Business_history>,
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
    }
  ): Promise<{ items: Business[]; currentPage: number; totalItems: number; totalPages: number }> {
    const offset = (currentPage - 1) * itemsPerPage;

    const whereConditions: string[] = ['b.removed IS NULL'];
    const params: any[] = [];

    if (filters.name) {
      whereConditions.push('b.name LIKE ?');
      params.push(`%${filters.name}%`);
    }

    if (filters.manager_company) {
      if (filters.manager_company == 'ABLECLOUD'){
        whereConditions.push('(type_attr.value IS NULL OR type_attr.value != "partner")');
      } else {
        whereConditions.push('type_attr.value = "partner" AND partner.name LIKE ?');
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
      whereConditions.push(`company_attr.value = ?`);
      params.push(filters.company_id);
    }

    if (filters.customer_id) {
      whereConditions.push(`b.customer_id = ?`);
      params.push(filters.customer_id);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Step 1: total 데이터 조회
    const countQuery = `
      SELECT COUNT(*) as count
      FROM business b
      LEFT JOIN customer c ON b.customer_id = c.id
      LEFT JOIN product p ON b.product_id = p.id
      LEFT JOIN keycloak.USER_ENTITY u
        ON b.manager_id = u.id
      LEFT JOIN keycloak.USER_ATTRIBUTE company_attr
        ON u.id = company_attr.user_id
        AND company_attr.name = 'company_id'
      LEFT JOIN keycloak.USER_ATTRIBUTE type_attr
        ON u.id = type_attr.user_id
        AND type_attr.name = 'type'
        AND type_attr.value IN ('partner', 'vendor')
      LEFT JOIN partner
        ON company_attr.value = CAST(partner.id AS CHAR)
      ${whereClause}
    `;
    const countResult = await this.businessRepository.query(countQuery, params);
    const totalItems = countResult[0]?.count || 0;

    if (totalItems === 0) {
      return { items: [], currentPage, totalItems, totalPages: 0 };
    }

    // Step 2: 데이터 조회
    const rawQuery = `
      SELECT 
        b.id AS id,
        b.name AS name,
        b.issued AS issued,
        b.expired AS expired,
        b.license_id AS license_id,
        b.customer_id AS customer_id,
        b.status AS status,
        b.core_cnt AS core_cnt,
        b.node_cnt AS node_cnt,
        b.manager_id AS manager_id,
        b.product_id AS product_id,
        b.details AS details,
        b.created AS created,
        c.name AS customer_name,
        p.name AS product_name,
        p.version AS product_version,
        pc.name AS product_category_name,
        u.username AS manager_name,
        CASE 
          WHEN type_attr.value = 'partner' THEN partner.name 
          ELSE 'ABLECLOUD' 
        END AS manager_company
      FROM business b
      LEFT JOIN customer c ON b.customer_id = c.id
      LEFT JOIN product p ON b.product_id = p.id
      LEFT JOIN product_category pc ON p.category_id = pc.id
      LEFT JOIN keycloak.USER_ENTITY u
        ON b.manager_id = u.id
      LEFT JOIN keycloak.USER_ATTRIBUTE company_attr
        ON u.id = company_attr.user_id
        AND company_attr.name = 'company_id'
      LEFT JOIN keycloak.USER_ATTRIBUTE type_attr
        ON u.id = type_attr.user_id
        AND type_attr.name = 'type'
        AND type_attr.value IN ('partner', 'vendor')
      LEFT JOIN partner
        ON company_attr.value = CAST(partner.id AS CHAR)
      ${whereClause}
      ORDER BY b.created DESC
      LIMIT ? OFFSET ?
    `;

    const data = await this.businessRepository.query(rawQuery, [...params, itemsPerPage, offset]);

    return {
      items: data,
      currentPage,
      totalItems,
      totalPages: Math.ceil(totalItems / itemsPerPage),
    };
  }

  async findAll_QueryBuilder(
    currentPage: number = 1,
    itemsPerPage: number = 10,
    filters: {
      name?: string;
      available?: string;
    }
  ): Promise<{ items: Business[]; currentPage: number; totalItems: number; totalPages: number }> {
    // Step 1: ID만 추출
    const subQuery = this.businessRepository
      .createQueryBuilder('business')
      .select('business.id')
      .where('business.removed is null')
      .orderBy('business.created', 'DESC');

    if (filters.name) {
      subQuery.andWhere('business.name LIKE :name', { name: `%${filters.name}%` });
    }

    if (filters.available) {
      subQuery.andWhere('business.license_id is null');
    }

    const totalItems = await subQuery.getCount();

    const ids = await subQuery
      .skip((currentPage - 1) * itemsPerPage)
      .take(itemsPerPage)
      .getRawMany();

    const businessIds = ids.map(item => item.business_id || item.id);
    if (businessIds.length === 0) {
      return { items: [], currentPage, totalItems, totalPages: 0 };
    }

    // Step 2: ID 기준 상세 데이터 조회
    const data = await this.businessRepository
      .createQueryBuilder('business')
      .leftJoin('customer', 'customer', 'business.customer_id = customer.id')
      .leftJoin('product', 'product', 'business.product_id = product.id')
      .select([
        'business.id as id',
        'business.name as name',
        'business.issued as issued',
        'business.expired as expired',
        'business.license_id as license_id',
        'business.customer_id as customer_id',
        'business.status as status',
        'business.core_cnt as core_cnt',
        'business.node_cnt as node_cnt',
        'business.manager_id as manager_id',
        'business.product_id as product_id',
        'business.details as details',
        'business.created as created',
        'customer.name as customer_name',
        'product.name as product_name',
        'product.version as product_version',
      ])
      .whereInIds(businessIds)
      .orderBy('business.created', 'DESC')
      .getRawMany();

    return {
      items: data,
      currentPage,
      totalItems,
      totalPages: Math.ceil(totalItems / itemsPerPage),
    };
  }

  async findOne(id: number): Promise<Business | null> {
    const rawQuery = `
      SELECT
        b.id AS id,
        b.name AS name,
        b.issued AS issued,
        b.expired AS expired,
        b.license_id AS license_id,
        b.customer_id AS customer_id,
        b.status AS status,
        b.core_cnt AS core_cnt,
        b.node_cnt AS node_cnt,
        b.manager_id AS manager_id,
        b.product_id AS product_id,
        b.details AS details,
        b.deposit_use AS deposit_use,
        b.created AS created,
        c.name AS customer_name,
        p.name AS product_name,
        p.version AS product_version,
        CASE WHEN l.removed IS NOT NULL THEN NULL ELSE l.license_key END AS license_key,
        CASE WHEN l.removed IS NOT NULL THEN NULL ELSE l.status END AS license_status,
        CASE WHEN l.removed IS NOT NULL THEN NULL ELSE l.issued END AS license_issued,
        CASE WHEN l.removed IS NOT NULL THEN NULL ELSE l.expired END AS license_expired,
        CASE WHEN l.removed IS NOT NULL THEN NULL ELSE l.trial END AS license_trial,
        u.username AS manager_name,
        CASE 
          WHEN type_attr.value = 'partner' THEN partner.name 
          ELSE 'ABLECLOUD' 
        END AS manager_company,
        ANY_VALUE(cr.deposit) AS deposit,
        ANY_VALUE(cr.credit) AS credit,
        credit.id AS credit_id
      FROM business b
      LEFT JOIN customer c ON b.customer_id = c.id
      LEFT JOIN product p ON b.product_id = p.id
      LEFT JOIN license l ON b.license_id = l.id
      LEFT JOIN keycloak.USER_ENTITY u
        ON b.manager_id = u.id
      LEFT JOIN keycloak.USER_ATTRIBUTE company_attr
        ON u.id = company_attr.user_id
        AND company_attr.name = 'company_id'
      LEFT JOIN keycloak.USER_ATTRIBUTE type_attr
        ON u.id = type_attr.user_id
        AND type_attr.name = 'type'
        AND type_attr.value IN ('partner', 'vendor')
      LEFT JOIN partner
        ON company_attr.value = CAST(partner.id AS CHAR)
      LEFT JOIN credit ON b.id = credit.business_id
      LEFT JOIN (
        SELECT partner_id, SUM(deposit) AS deposit, SUM(credit) AS credit
        FROM credit
        WHERE removed IS NULL
        GROUP BY partner_id
      ) cr ON partner.id = cr.partner_id
      WHERE company_attr.id IS NOT NULL
        AND type_attr.id IS NOT NULL
        AND b.id = ?
    `;

    const [business] = await this.businessRepository.query(rawQuery, [id]);

    if (!business) return null;

    return {
      ...business,
      // customer_name: business.customer_name,
      // license_key: business.license_key,
      // license_status: business.license_status,
      // license_issued: business.license_issued,
      // license_expired: business.license_expired,
    };
  }

  async findOne_QueryBuilder(id: number): Promise<Business | null> {
    const query = this.businessRepository.createQueryBuilder('business')
      .leftJoin('customer', 'customer', 'business.customer_id = customer.id')
      .leftJoin('product', 'product', 'business.product_id = product.id')
      .leftJoin('license', 'license', 'business.license_id = license.id')
      .select([
        'business.id as id',
        'business.name as name',
        'business.issued as issued',
        'business.expired as expired',
        'business.license_id as license_id',
        'business.customer_id as customer_id',
        'business.status as status',
        'business.core_cnt as core_cnt',
        'business.node_cnt as node_cnt',
        'business.manager_id as manager_id',
        'business.product_id as product_id',
        'business.details as details',
        'business.created as created',
        'customer.name as customer_name',
        'product.name as product_name',
        'product.version as product_version',
        'CASE WHEN license.removed IS NOT NULL THEN NULL ELSE license.license_key END AS license_key',
        'CASE WHEN license.removed IS NOT NULL THEN NULL ELSE license.status END AS license_status',
        'CASE WHEN license.removed IS NOT NULL THEN NULL ELSE license.issued END AS license_issued',
        'CASE WHEN license.removed IS NOT NULL THEN NULL ELSE license.expired END AS license_expired',
      ])
      .where('business.id = :id', { id });

    const business = await query.getRawOne();
    if (!business) return null;

    return {
      ...business,
      customer_name: business.customer_name,
      license_key: business.license_key,
      license_status: business.license_status,
      // license_cpu_core: business.license_cpu_core,
      license_issued: business.license_issued,
      license_expired: business.license_expired,
    };
  }

  async create(createBusinessDto: CreateBusinessDto, createCreditDto: CreateCreditDto): Promise<Business> {
    // create business
    const business = this.businessRepository.create(createBusinessDto);
    await this.businessRepository.save(business);

    // create credit
    if (createBusinessDto.deposit_use) {
      const credit = this.creditRepository.create(createCreditDto)
      credit.business_id = business.id;
      credit.partner_id = createBusinessDto.partner_id;
      credit.credit = createBusinessDto.core_cnt;

      this.creditRepository.save(credit);
    }

    return business;
  }

  async update(id: number, updateBusinessDto: UpdateBusinessDto, updateCreditDto: UpdateCreditDto): Promise<Business> {
    const business = await this.findOne(id);
    const updatedBusiness = {
      ...business,
      ...updateBusinessDto,
    };
    await this.businessRepository.save(updatedBusiness);

    // update credit
    if (updateBusinessDto.deposit_use) {
      const credit = this.creditRepository.create(updateCreditDto)
      credit.id = updateBusinessDto.credit_id;
      credit.credit = updateBusinessDto.core_cnt;

      this.creditRepository.save(credit);
    } else {
      await this.creditRepository.softDelete(updateBusinessDto.credit_id);
    }

    return business
  }

  async delete(id: number): Promise<void> {
    const business = await this.findOne(id);

    // license_id를 null로 설정
    business.license_id = null;
    await this.businessRepository.save(business);

    await this.businessRepository.softDelete(id);
  }

  async registerLicense(id: number, license_id: string): Promise<Business> {
    const business = await this.businessRepository.findOne({ where: { id } });
    if (!business) {
      throw new Error(`Business with ID ${id} not found`);
    }
    business.license_id = license_id;

    const savedBusiness = await this.businessRepository.save(business);
    const formattedusiness = {
      ...savedBusiness,
      updated: this.removeMicrosecondsFromTimestamp(savedBusiness.updated),
    };

    return formattedusiness as unknown as Business;
  }

  async findAllHistory(id: number): Promise<Business_history[] | null> {
    const rawQuery = `
      SELECT 
        b.id AS id,
        b.business_id AS business_id,
        b.issue AS issue,
        b.solution AS solution,
        b.status AS status,
        b.issued AS issued
      FROM business_history b
      WHERE b.removed is null
        AND b.business_id = ?
      ORDER BY b.issued DESC
    `;

    const business_history = await this.businessRepository.query(rawQuery, [id]);
    return business_history;
  }

  async findOneHistory(id: number, historyId: string): Promise<Business_history | null> {
    const rawQuery = `
      SELECT 
        b.id AS id,
        b.business_id AS business_id,
        b.issue AS issue,
        b.solution AS solution,
        b.status AS status,
        b.manager AS manager,
        b.issued AS issued,
        b.started AS started,
        b.ended AS ended,
        b.note AS note,
        b.created AS created
      FROM business_history b
      WHERE b.removed is null
        AND b.id = ?
    `;

    const [business_history] = await this.businessRepository.query(rawQuery, [historyId]);
    if (!business_history) return null;

    return {
      ...business_history,
    };
  }

  async createHistory(id: string, createBusiness_historyDto: CreateBusiness_historyDto): Promise<Business_history> {
    const newHistory = this.business_historyRepository.create({
      ...createBusiness_historyDto,
      business_id: id
    });
    return this.business_historyRepository.save(newHistory);
  }

  async updateHistory(historyId: number, updateBusiness_historyDto: UpdateBusiness_historyDto): Promise<Business_history> {
    const business_history = await this.findOne(historyId);
    delete (business_history as any).created;
    const updatedBusiness = {
      ...business_history,
      ...updateBusiness_historyDto,
    };
    return this.business_historyRepository.save(updatedBusiness);
  }

  async deleteHistory(historyId: string): Promise<void> {
    await this.business_historyRepository.softDelete(historyId);
  }

  private removeMicrosecondsFromTimestamp(timestamp: string | Date): string {
    const date = new Date(timestamp)
    return date.toISOString().replace(/\.\d{3}Z$/, 'Z')
  }
}