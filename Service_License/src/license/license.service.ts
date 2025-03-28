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
      partnerId?: number;
      company_id?: string;
    }
  ): Promise<{ items: License[]; total: number; page: number; totalPages: number }> {
    const query = this.licenseRepository.createQueryBuilder('license')
                  .leftJoin('product', 'product', 'license.product_id = product.id')
                  .leftJoin('business', 'business', 'license.business_id = business.id')
                  .select([
                    'license.*',
                    'product.name as product_name',
                    'license.approved as approved',
                    'business.name as business_name'
                  ])
                  .orderBy('license.created', 'DESC')
                  .where('license.removed IS NULL');

    if (filters.productId) {
      query.andWhere('product.id = :productId', { 
        productId: filters.productId 
      });
    }
    if (filters.productType) {
      query.andWhere('license.product_type = :productType', { productType: filters.productType });
    }
    if (filters.businessType) {
      query.andWhere('license.business_type = :businessType', { businessType: filters.businessType });
    }

    if (filters.company_id) {
      query.andWhere('license.company_id = :company_id', { company_id: filters.company_id });
    }

    const total = await query.getCount();
    const items = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getRawMany();

    const formattedItems = items.map(license => ({
      ...license,
      product_name: license.product_name,
      partner_name: license.partner_name,
      issued: this.formatDateToYYYYMMDD(license.issued),
      expired: this.formatDateToYYYYMMDD(license.expired),
      created: this.removeMicrosecondsFromTimestamp(license.created),
      updated: this.removeMicrosecondsFromTimestamp(license.updated),
      approved: license.approve_user ? license.approved : null,
      approve_user: license.approve_user
    }));

    return {
      items: formattedItems,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getLicenseById(id: number): Promise<License | null> {
    const query = this.licenseRepository.createQueryBuilder('license')
      .leftJoin('product', 'product', 'license.product_id = product.id')
      .leftJoinAndSelect('partner', 'company', 'license.company_id = company.id')
      .leftJoinAndSelect('business', 'business', 'license.business_id = business.id')
      .select([
        'license.*',
        'product.name as product_name',
        'company.name as company_name',
        'company.telnum as company_telnum',
        'company.level as company_level',
        'business.name as business_name'
      ])
      .where('license.id = :id', { id });

    const license = await query.getRawOne();
    if (!license) return null;

    return {
      ...license,
      product_name: license.product_name,
      company_name: license.company_name,
      company_telnum: license.company_telnum,
      company_level: license.company_level,
      issued: this.formatDateToYYYYMMDD(license.issued),
      expired: this.formatDateToYYYYMMDD(license.expired),
      created: this.removeMicrosecondsFromTimestamp(license.created),
      updated: this.removeMicrosecondsFromTimestamp(license.updated),
      approved: license.approved ? license.approved : null,
      approve_user: license.approve_user
    };
  }

  async createLicense(data: Partial<License>): Promise<License> {
    const license = this.licenseRepository.create({
      ...data,
      license_key: uuidv4(),
      issued: data.issued || '0000-00-00',
      expired: data.expired || '0000-00-00',
      approved: new Date().toISOString(), // 문자열로 변환하여 저장
      status: data.status
    })
    const savedLicense = await this.licenseRepository.save(license)
    return {
      ...savedLicense,
      issued: this.formatDateToYYYYMMDD(savedLicense.issued),
      expired: this.formatDateToYYYYMMDD(savedLicense.expired),
      approved: savedLicense.approve_user ? savedLicense.approved : null,
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
    license.status = createLicenseDto.status;

    // approve_user가 있는 경우 approved 시간도 함께 설정
    if (createLicenseDto.approve_user) {
        license.approve_user = createLicenseDto.approve_user;
        license.approved = new Date().toISOString(); // 문자열로 변환하여 저장
        license.status = 'active';
    }

    const savedLicense = await this.licenseRepository.save(license);
    
    return {
      ...savedLicense,
      approved: savedLicense.approved ? this.formatDateToYYYYMMDD(savedLicense.approved) : null
    } as unknown as License;
  }

  async update(id: number, updateLicenseDto: UpdateLicenseDto) {
    const license = await this.licenseRepository.findOne({ where: { id } });
    if (updateLicenseDto.approve_user) {
      license.approved = new Date().toISOString(); // 문자열로 변환하여 저장
      license.approve_user = updateLicenseDto.approve_user;
      license.status = 'active';
    }

    if (updateLicenseDto.product_type) {
      license.product_type = updateLicenseDto.product_type;
    }

    if (updateLicenseDto.status) {
      license.status = updateLicenseDto.status;
      if (updateLicenseDto.status !== 'active') {
        license.approved = null;
        license.approve_user = null;
      }
    }

    const savedLicense = await this.licenseRepository.save(license);
    
    const formattedLicense = {
      ...savedLicense,
      approved: savedLicense.approved ? this.formatDateToYYYYMMDD(savedLicense.approved) : null
    };

    return formattedLicense as unknown as License;
  }

  async approveLicense(id: number, approveUser: string): Promise<License> {
    const license = await this.licenseRepository.findOne({ where: { id } });
    if (!license) {
      throw new Error(`License with ID ${id} not found`);
    }
    license.approve_user = approveUser;
    license.approved = new Date().toISOString(); // 문자열로 변환하여 저장
    license.status = 'active';

    const savedLicense = await this.licenseRepository.save(license);
    const formattedLicense = {
      ...savedLicense,
      issued: this.formatDateToYYYYMMDD(savedLicense.issued),
      expired: this.formatDateToYYYYMMDD(savedLicense.expired),
      created: this.removeMicrosecondsFromTimestamp(savedLicense.created),
      updated: this.removeMicrosecondsFromTimestamp(savedLicense.updated),
      approved: savedLicense.approved ? this.formatDateToYYYYMMDD(savedLicense.approved) : null
    };

    return formattedLicense as unknown as License;
  }
}