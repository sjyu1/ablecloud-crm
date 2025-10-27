import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { License } from './license.entity'
import { Business } from '../business/business.entity'
import { v4 as uuidv4 } from 'uuid'
import { CreateLicenseDto, UpdateLicenseDto } from './dto/license.dto'

@Injectable()
export class LicenseService {
  constructor(
    @InjectRepository(License)
    private readonly licenseRepository: Repository<License>,

    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
  ) {}

  async findAll(
    currentPage: number = 1,
    itemsPerPage: number = 10,
    filters: {
      productId?: string;
      businessType?: string;
      company_id?: string;
      trial?: string;
      business_name?: string;
      license_key?: string;
      status?: string;
    }
  ): Promise<{ data: License[]; pagination: {} }> {
    const offset = (currentPage - 1) * itemsPerPage;
  
    // 필터 조건
    const whereConditions: string[] = ['l.removed IS NULL'];
    const params: any[] = [];
  
    if (filters.businessType) {
      whereConditions.push('l.business_type = ?');
      params.push(filters.businessType);
    }
  
    if (filters.company_id) {
      whereConditions.push('l.company_id = ?');
      params.push(filters.company_id);
    }
  
    if (filters.trial !== undefined) {
      whereConditions.push('l.trial = ?');
      params.push(filters.trial);
    }
  
    if (filters.business_name) {
      whereConditions.push('b.name LIKE ?');
      params.push(`%${filters.business_name}%`);
    }
  
    if (filters.license_key) {
      whereConditions.push('l.license_key LIKE ?');
      params.push(`%${filters.license_key}%`);
    }
  
    if (filters.status) {
      whereConditions.push('l.status = ?');
      params.push(filters.status);
    }
  
    // productId가 있는 경우 EXISTS로 필터링 (business → product 연계)
    if (filters.productId) {
      whereConditions.push(`
        EXISTS (
          SELECT 1
          FROM business bs
          WHERE bs.id = l.business_id
            AND bs.product_id = ?
            AND bs.removed IS NULL
        )
      `);
      params.push(filters.productId);
    }
  
    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;
  
    // Step 1: 전체 개수 조회
    const countQuery = `
      SELECT COUNT(*) as count
      FROM license l
      LEFT JOIN business b ON l.business_id = b.id
      ${whereClause}
    `;
    const countResult = await this.licenseRepository.query(countQuery, params);
    const totalItems = countResult[0]?.count || 0;
  
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
      SELECT 
        l.id AS id,
        l.license_key AS license_key,
        l.issued AS issued,
        l.expired AS expired,
        l.status AS status,
        l.company_id AS company_id,
        l.approve_user AS approve_user,
        l.approved AS approved,
        l.business_id AS business_id,
        l.issued_id AS issued_id,
        l.trial AS trial,
        l.created AS created,
        b.name AS business_name,
        p.name AS product_name,
        p.version AS product_version,
        u.username AS issued_name
      FROM license l
      LEFT JOIN business b ON l.business_id = b.id
      LEFT JOIN product p ON b.product_id = p.id
      LEFT JOIN keycloak.USER_ENTITY u ON l.issued_id = u.id
      ${whereClause}
      ORDER BY l.created DESC
      LIMIT ? OFFSET ?
    `;

    const result = await this.licenseRepository.query(dataQuery, [...params, itemsPerPage, offset]);
  
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

  async findOne(id: number): Promise<{ data: License | null }> {
    const query = `
      SELECT 
        l.id AS id,
        l.license_key AS license_key,
        l.issued AS issued,
        l.expired AS expired,
        l.status AS status,
        l.company_id AS company_id,
        l.approve_user AS approve_user,
        l.approved AS approved,
        l.business_id AS business_id,
        l.issued_id AS issued_id,
        l.trial AS trial,
        l.oem AS oem,
        l.created AS created,
        IFNULL(c.name, 'ABLECLOUD') AS company_name,
        c.telnum AS company_telnum,
        c.level AS company_level,
        b.name AS business_name,
        p.id AS product_id,
        p.name AS product_name,
        p.version AS product_version,
        u.username AS issued_name
      FROM license l
      LEFT JOIN partner c ON l.company_id = c.id
      LEFT JOIN business b ON l.business_id = b.id
      LEFT JOIN product p ON b.product_id = p.id
      LEFT JOIN keycloak.USER_ENTITY u ON l.issued_id = u.id
      WHERE l.id = ?
      LIMIT 1
    `;
  
    const [license] = await this.licenseRepository.query(query, [id]);
  
    return {
      data: license || null,
    };
  }
  
  async create(data: Partial<License>): Promise<License> {
    const now = new Date().toISOString();
  
    const license = this.licenseRepository.create({
      ...data,
      license_key: uuidv4(),
      issued: data.issued ?? '0000-00-00',
      expired: data.expired ?? '0000-00-00',
      approved: now,
      status: data.status,
    });
  
    const savedLicense = await this.licenseRepository.save(license);
  
    return {
      ...savedLicense,
      issued: this.formatDateToYYYYMMDD(savedLicense.issued),
      expired: this.formatDateToYYYYMMDD(savedLicense.expired),
      approved: savedLicense.approve_user ? savedLicense.approved : null,
      created: this.removeMicrosecondsFromTimestamp(savedLicense.created),
      updated: this.removeMicrosecondsFromTimestamp(savedLicense.updated),
    };
  }
  
  async update(id: number, updateData: Partial<License>): Promise<License> {
    const license = await this.licenseRepository.findOne({ where: { id } });
    if (!license) {
      throw new Error(`License with ID ${id} not found`);
    }
  
    const updatedLicense = this.licenseRepository.merge(license, {
      ...updateData,
      issued: updateData.issued || license.issued,
      expired: updateData.expired || license.expired,
    });
  
    const savedLicense = await this.licenseRepository.save(updatedLicense);
    return savedLicense;
  }
  
  async delete(id: number): Promise<void> {
    const license = await this.licenseRepository.findOne({ where: { id } });
    if (!license) {
      throw new Error(`License with ID ${id} not found`);
    }
  
    if (license.business_id) {
      const businessId = Number(license.business_id);
      if (!isNaN(businessId)) {
        const business = await this.businessRepository.findOne({ where: { id: businessId } });
        if (business) {
          business.license_id = null;
          await this.businessRepository.save(business);
        }
      }
    }
  
    await this.licenseRepository.softDelete(id);
  }
  
  
  async approveLicense(id: number, approveUser: string): Promise<License> {
    const license = await this.licenseRepository.findOne({ where: { id } });
    if (!license) {
      throw new Error(`License with ID ${id} not found`);
    }
  
    license.approve_user = approveUser;
    license.approved = new Date().toISOString();
    license.status = 'active';
  
    const savedLicense = await this.licenseRepository.save(license);
  
    return {
      ...savedLicense,
      issued: this.formatDateToYYYYMMDD(savedLicense.issued),
      expired: this.formatDateToYYYYMMDD(savedLicense.expired),
      approved: this.formatDateToYYYYMMDD(savedLicense.approved),
      created: this.removeMicrosecondsFromTimestamp(savedLicense.created),
      updated: this.removeMicrosecondsFromTimestamp(savedLicense.updated),
    };
  }
  
  private formatDateToYYYYMMDD(date: string | Date): string {
    if (!date) return '0000-00-00';
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  
  private removeMicrosecondsFromTimestamp(timestamp: string | Date): string {
    return new Date(timestamp).toISOString().replace(/\.\d{3}Z$/, 'Z');
  }
}
