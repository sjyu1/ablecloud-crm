import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { License } from './license.entity'
import { v4 as uuidv4 } from 'uuid'
import { CreateLicenseDto, UpdateLicenseDto } from './dto/license.dto'

@Injectable()
export class LicenseService {
  constructor(
    @InjectRepository(License)
    private readonly licenseRepository: Repository<License>,
  ) {}

  private formatDateToYYYYMMDD(date: string | Date): string {
    if (!date) return '0000-00-00'
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  private removeMicrosecondsFromTimestamp(timestamp: string | Date): string {
    const date = new Date(timestamp)
    return date.toISOString().replace(/\.\d{3}Z$/, 'Z')
  }

  async getAllLicenses(
    page: number = 1,
    limit: number = 10,
    filters: {
      productId?: string;
      productType?: string;
      businessType?: string;
      companyId?: number;
    }
  ): Promise<{ items: License[]; total: number; page: number; totalPages: number }> {
    const query = this.licenseRepository.createQueryBuilder('license')
                  .orderBy('license.created', 'DESC');

    if (filters.productId) {
      query.andWhere('license.product_id = :productId', { productId: filters.productId });
    }
    if (filters.productType) {
      query.andWhere('license.product_type = :productType', { productType: filters.productType });
    }
    if (filters.businessType) {
      query.andWhere('license.business_type = :businessType', { businessType: filters.businessType });
    }
    if (filters.companyId) {
      query.andWhere('license.company_id = :companyId', { companyId: filters.companyId });
    }

    const total = await query.getCount();
    const items = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    const formattedItems = items.map(license => ({
      ...license,
      issued: this.formatDateToYYYYMMDD(license.issued),
      expired: this.formatDateToYYYYMMDD(license.expired),
      created: this.removeMicrosecondsFromTimestamp(license.created),
      updated: this.removeMicrosecondsFromTimestamp(license.updated),
    }));

    return {
      items: formattedItems,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getLicenseById(id: number): Promise<License | null> {
    const license = await this.licenseRepository.findOne({ where: { id } })
    if (!license) return null
    return {
      ...license,
      issued: this.formatDateToYYYYMMDD(license.issued),
      expired: this.formatDateToYYYYMMDD(license.expired),
      created: this.removeMicrosecondsFromTimestamp(license.created),
      updated: this.removeMicrosecondsFromTimestamp(license.updated),
    }
  }

  async createLicense(data: Partial<License>): Promise<License> {
    const license = this.licenseRepository.create({
      ...data,
      license_key: uuidv4(),
      issued: data.issued || '0000-00-00',
      expired: data.expired || '0000-00-00',
    })
    const savedLicense = await this.licenseRepository.save(license)
    return {
      ...savedLicense,
      issued: this.formatDateToYYYYMMDD(savedLicense.issued),
      expired: this.formatDateToYYYYMMDD(savedLicense.expired),
      created: this.removeMicrosecondsFromTimestamp(savedLicense.created),
      updated: this.removeMicrosecondsFromTimestamp(savedLicense.updated),
    }
  }

  async updateLicense(id: number, updateData: Partial<License>): Promise<License | null> {
    const license = await this.licenseRepository.findOne({ where: { id } })
    if (!license) throw new Error(`License with ID ${id} not found`)
    const updatedLicense = {
      ...license,
      ...updateData,
      issued: updateData.issued || license.issued,
      expired: updateData.expired || license.expired,
    }
    await this.licenseRepository.save(updatedLicense)
    return this.getLicenseById(id)
  }

  async deleteLicense(id: number): Promise<void> {
    const license = await this.licenseRepository.findOne({ where: { id } })
    if (!license) throw new Error(`License with ID ${id} not found`)
    await this.licenseRepository.delete(id)
  }

  async create(createLicenseDto: CreateLicenseDto) {
    const license = new License();
    license.product_type = createLicenseDto.product_type;
    license.cpu_core = createLicenseDto.cpu_core;
    license.product_cnt = createLicenseDto.product_cnt;
    license.business_type = createLicenseDto.business_type;
    license.business_name = createLicenseDto.business_name;
    license.user_type = createLicenseDto.user_type;
    license.company_id = createLicenseDto.company_id;

    return this.licenseRepository.save(license);
  }

  async update(id: number, updateLicenseDto: UpdateLicenseDto) {
    const license = await this.licenseRepository.findOne({ where: { id } });
    if (updateLicenseDto.product_type) {
      license.product_type = updateLicenseDto.product_type;
    }
    if (updateLicenseDto.cpu_core !== undefined) {
      license.cpu_core = updateLicenseDto.cpu_core;
    }
    if (updateLicenseDto.product_cnt !== undefined) {
      license.product_cnt = updateLicenseDto.product_cnt;
    }
    if (updateLicenseDto.business_type) {
      license.business_type = updateLicenseDto.business_type as "POC" | "BMT" | "TEMP";
    }
    if (updateLicenseDto.business_name) {
      license.business_name = updateLicenseDto.business_name;
    }
    if (updateLicenseDto.user_type) {
      license.user_type = updateLicenseDto.user_type;
    }
    if (updateLicenseDto.company_id !== undefined) {
      license.company_id = updateLicenseDto.company_id;
    }

    return this.licenseRepository.save(license);
  }
}