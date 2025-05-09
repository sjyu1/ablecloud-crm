import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from './business.entity';
import { CreateBusinessDto, UpdateBusinessDto } from './dto/business.dto';

@Injectable()
export class BusinessService {
  constructor(
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
  ) {}

  async findAll(
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

  async create(createBusinessDto: CreateBusinessDto): Promise<Business> {
    const business = this.businessRepository.create(createBusinessDto);
    return this.businessRepository.save(business);
  }

  async update(id: number, updateBusinessDto: UpdateBusinessDto): Promise<Business> {
    const business = await this.findOne(id);
    const updatedBusiness = {
      ...business,
      ...updateBusinessDto,
    };
    return this.businessRepository.save(updatedBusiness);
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

  async deleteLicense(id: number): Promise<void> {
    const business = await this.findOne(id);

    // license_id를 null로 설정
    business.license_id = null;
    await this.businessRepository.save(business);
  }

  private removeMicrosecondsFromTimestamp(timestamp: string | Date): string {
    const date = new Date(timestamp)
    return date.toISOString().replace(/\.\d{3}Z$/, 'Z')
  }
}