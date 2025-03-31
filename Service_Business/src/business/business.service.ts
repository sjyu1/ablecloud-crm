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

  private removeMicrosecondsFromTimestamp(timestamp: string | Date): string {
    const date = new Date(timestamp)
    return date.toISOString().replace(/\.\d{3}Z$/, 'Z')
  }

  async create(createBusinessDto: CreateBusinessDto): Promise<Business> {
    const business = this.businessRepository.create(createBusinessDto);
    return this.businessRepository.save(business);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    filters: {
      name?: string;
      available?: string;
    }
  ): Promise<{ items: Business[]; total: number; page: number; totalPages: number }> {
    const query = this.businessRepository.createQueryBuilder('business')
                  .leftJoin('customer', 'customer', 'business.customer_id = customer.id')
                  .select([
                    'business.*',
                    'customer.name as customer_name'
                  ])
                  .orderBy('business.created', 'DESC')
                  .where('business.removed IS NULL');

    if (filters.name) {
      query.andWhere('business.id = :name', { 
        productId: filters.name 
      });
    }

    if (filters.available) {
      query.andWhere('business.license_id IS NULL');
    }

    const total = await query.getCount();
    const items = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getRawMany();

    const formattedItems = items.map(business => ({
      ...business,
      customer_name: business.customer_name
    }));

    return {
      items: formattedItems,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getBusinessById(id: number): Promise<Business | null> {
    const query = this.businessRepository.createQueryBuilder('business')
      .leftJoin('customer', 'customer', 'business.customer_id = customer.id')
      .leftJoin('license', 'license', 'business.id = license.business_id')
      .select([
        'business.*',
        'customer.name as customer_name',
        'license.license_key as license_key',
        'license.status as license_status',
        // 'license.cpu_core as license_cpu_core',
        'license.issued as license_issued',
        'license.expired as license_expired',
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

  async findOne(id: number): Promise<Business> {
    const business = await this.businessRepository.findOne({
      where: { id },
      withDeleted: false
    });
    
    if (!business) {
      throw new NotFoundException(`사업 ID ${id}를 찾을 수 없습니다.`);
    }
    
    return business;
  }

  async update(id: number, updateBusinessDto: UpdateBusinessDto): Promise<Business> {
    const business = await this.findOne(id);
    const updatedBusiness = {
      ...business,
      ...updateBusinessDto,
    };
    return this.businessRepository.save(updatedBusiness);
  }

  async remove(id: number): Promise<void> {
    const business = await this.findOne(id);
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
}


