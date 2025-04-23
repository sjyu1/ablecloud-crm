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

  async create(createPartnerDto: CreatePartnerDto): Promise<Partner> {
    const partner = this.partnerRepository.create(createPartnerDto);
    return await this.partnerRepository.save(partner);
  }

  async findAll(
    page: number,
    limit: number,
    level?: 'PLATINUM' | 'GOLD' | 'SILVER' | 'VAR',
    name?: string,
    id?: string
  ): Promise<{ partners: Partner[]; total: number }> {
    try {
      const queryBuilder = this.partnerRepository.createQueryBuilder('partner')
        .where('partner.removed IS NULL');

      if (level) {
        queryBuilder.andWhere('partner.level = :level', { level });
      }

      if (name) {
        queryBuilder.andWhere('LOWER(partner.name) LIKE LOWER(:name)', { name: `%${name}%` });
      }

      if (id) {
        queryBuilder.andWhere('partner.id = :id', { id });
      }

      // 페이지와 리미트가 숫자인지 확인
      const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
      const take = Math.max(1, Number(limit));

      const [partners, total] = await queryBuilder
        .orderBy('partner.created', 'DESC')
        .skip(skip)
        .take(take)
        .getManyAndCount();

      return { partners, total };
    } catch (error) {
      // console.error('파트너 검색 중 오류 발생:', error);
      throw error;
    }
  }

  async findOne(id: number): Promise<Partner> {
    const partner = await this.partnerRepository.findOne({
      where: { id },
      withDeleted: false
    });

    if (!partner) {
      throw new NotFoundException(`파트너 ID ${id}를 찾을 수 없습니다.`);
    }

    return partner;
  }

  async update(id: number, updatePartnerDto: UpdatePartnerDto): Promise<Partner> {
    const partner = await this.findOne(id);
    const updatedPartner = {
      ...partner,
      ...updatePartnerDto,
    };
    return this.partnerRepository.save(updatedPartner);
  }

  async remove(id: number): Promise<void> {
    const partner = await this.findOne(id);
    await this.partnerRepository.softDelete(id);
  }
}