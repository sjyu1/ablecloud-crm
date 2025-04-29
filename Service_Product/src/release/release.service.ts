import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Release } from './release.entity';
import { CreateReleaseDto, UpdateReleaseDto } from './dto/release.dto';

@Injectable()
export class ReleaseService {
  constructor(
    @InjectRepository(Release)
    private readonly releaseRepository: Repository<Release>,
  ) {}

  async create(createReleaseDto: CreateReleaseDto): Promise<Release> {
    createReleaseDto.enabled = true;
    const release = this.releaseRepository.create(createReleaseDto);
    return this.releaseRepository.save(release);
  }

  async findAll(
    page: number,
    limit: number,
    version?: string
  ): Promise<{ releases: Release[]; total: number }> {
    const queryBuilder = this.releaseRepository.createQueryBuilder('release')
      .andWhere('release.enabled = true')
      .andWhere('release.removed IS NULL');

    if (version) {
      queryBuilder.andWhere('release.version LIKE :version', { version: `%${version}%` });
    }

    const [releases, total] = await queryBuilder
      .orderBy('release.created', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { releases, total };
  }

  async findOne(id: number): Promise<Release> {
    const release = await this.releaseRepository.findOne({
      where: { id },
      withDeleted: false
    });

    if (!release) {
      throw new NotFoundException(`제품 ID ${id}를 찾을 수 없습니다.`);
    }

    return release;
  }

  async update(id: number, updateReleaseDto: UpdateReleaseDto): Promise<Release> {
    const release = await this.findOne(id);
    const updatedRelease = {
      ...release,
      ...updateReleaseDto,
    };
    return this.releaseRepository.save(updatedRelease);
  }

  async remove(id: number): Promise<void> {
    const release = await this.findOne(id);
    await this.releaseRepository.softDelete(id);
  }

  async disabledRelease(id: number): Promise<Release> {
    const release = await this.releaseRepository.findOne({ where: { id } });
    if (!release) {
      throw new Error(`release with ID ${id} not found`);
    }
    release.enabled = false;

    const savedRelease = await this.releaseRepository.save(release);
    const formattedRelease = {
      ...savedRelease,
    };

    return formattedRelease as unknown as Release;
  }
}