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
      businessType?: string;
      partnerId?: number;
      company_id?: string;
    }
  ): Promise<{ items: License[]; total: number; page: number; totalPages: number }> {
    const query = this.licenseRepository.createQueryBuilder('license')
                  .leftJoin('product', 'product', 'license.product_id = product.id')
                  // .leftJoin('partner', 'partner', 'license.partner_id = partner.id')
                  .leftJoin('business', 'business', 'license.business_id = business.id')
                  .select([
                    'license.*',
                    'product.name as product_name',
                    // 'partner.name as partner_name',
                    'license.approved as approved',
                    'business.name as business_name'
                  ])
                  .orderBy('license.created', 'DESC')
                  .where('license.removed IS NULL');

    // if (filters.partnerId) {
    //   query.andWhere('license.issued_user IN (SELECT id FROM user WHERE partner_id = :partnerId)', { 
    //     partnerId: filters.partnerId 
    //   });
    // }

    if (filters.productId) {
      query.andWhere('product.id = :productId', { 
        productId: filters.productId 
      });
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
      // .leftJoinAndSelect('partner', 'issuer', 'license.issued_user = issuer.id')
      .leftJoinAndSelect('business', 'business', 'license.business_id = business.id')
      .select([
        'license.*',
        'product.name as product_name',
        'company.name as company_name',
        'company.telnum as company_telnum',
        'company.level as company_level',
        // 'issuer.name as issuer_company_name',
        // 'issuer.telnum as issuer_company_telnum',
        // 'issuer.level as issuer_company_level',
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
      // issuer_company_name: license.issuer_company_name,
      // issuer_company_telnum: license.issuer_company_telnum,
      // issuer_company_level: license.issuer_company_level,
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
      // status: data.user_type === 'Admin' ? 'active' : 'inactive'
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
    // license.cpu_core = createLicenseDto.cpu_core;
    // license.business_type = createLicenseDto.business_type;
    // license.business_name = createLicenseDto.business_name;
    // license.user_type = createLicenseDto.user_type;
    // license.partner_id = createLicenseDto.partner_id;
    // license.issued_user = createLicenseDto.issued_user;
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

    // if (updateLicenseDto.cpu_core !== undefined) {
    //   license.cpu_core = updateLicenseDto.cpu_core;
    // }
    // if (updateLicenseDto.business_type) {
    //   license.business_type = updateLicenseDto.business_type as "POC" | "BMT" | "TEMP";
    // }
    // if (updateLicenseDto.business_name) {
    //   license.business_name = updateLicenseDto.business_name;
    // }
    // if (updateLicenseDto.user_type) {
    //   license.user_type = updateLicenseDto.user_type;
    //   // license.status = updateLicenseDto.user_type === 'Admin' ? 'active' : 'inactive';
    // }
    // if (updateLicenseDto.partner_id !== undefined) {
    //   license.partner_id = updateLicenseDto.partner_id;
    // }
    // if (updateLicenseDto.issued_user) {
    //   license.issued_user = updateLicenseDto.issued_user;
    // }
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