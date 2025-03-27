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

  async create(createBusinessDto: CreateBusinessDto): Promise<Business> {
    const business = this.businessRepository.create(createBusinessDto);
    return this.businessRepository.save(business);
  }

  async findAll(
    page: number,
    limit: number,
    name?: string
  ): Promise<{ businesses: Business[]; total: number }> {
    const queryBuilder = this.businessRepository.createQueryBuilder('business')
      .leftJoinAndSelect('business.customer_id', 'customer')
      .select([
        'customer.name as customer_name'
      ])
      .where('business.removed IS NULL');

    if (name) {
      queryBuilder.andWhere('business.name LIKE :name', { name: `%${name}%` });
    }

    const [businesses, total] = await queryBuilder
      .orderBy('business.created', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { businesses, total };
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
}