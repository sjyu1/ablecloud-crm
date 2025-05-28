import { Injectable } from '@nestjs/common'
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
      businessName?: string;
    }
  ): Promise<{ items: License[]; currentPage: number; totalItems: number; totalPages: number }> {
    const offset = (currentPage - 1) * itemsPerPage;

    const whereConditions: string[] = [`l.removed IS NULL`];
    const params: any[] = [];

    if (filters.businessType) {
      whereConditions.push(`l.business_type = ?`);
      params.push(filters.businessType);
    }

    if (filters.company_id) {
      whereConditions.push(`l.company_id = ?`);
      params.push(filters.company_id);
    }

    if (filters.businessName) {
      whereConditions.push(`b.name LIKE ?`);
      params.push(`%${filters.businessName}%`);
    }

    if (filters.trial !== undefined) {
      whereConditions.push(`l.trial = ?`);
      params.push(filters.trial);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';


    // Step 1: total 데이터 조회
    const countQuery = `
      SELECT COUNT(*) as count
      FROM license l
      LEFT JOIN business b ON l.business_id = b.id
      ${whereClause}
    `;
    const countResult = await this.licenseRepository.query(countQuery, params);
    const totalItems = countResult[0]?.count || 0;

    if (totalItems === 0) {
      return { items: [], currentPage, totalItems, totalPages: 0 };
    }

    // Step 2: 데이터 조회
    const rawQuery = `
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
    const data = await this.licenseRepository.query(rawQuery, [...params, itemsPerPage, offset]);
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
      productId?: string;
      licenseKey?: string;
      businessType?: string;
      company_id?: string;
      trial?: string;
    }
  ): Promise<{ items: License[]; currentPage: number; totalItems: number; totalPages: number }> {
    // Step 1: ID만 추출
    const subQuery = this.licenseRepository
      .createQueryBuilder('license')
      .select('license.id', 'id')
      .where('license.removed is null')
      .orderBy('license.created', 'DESC');

    if (filters.businessType) {
      subQuery.andWhere('license.business_type = :businessType', { businessType: filters.businessType });
    }

    if (filters.company_id) {
      subQuery.andWhere('license.company_id = :company_id', { company_id: filters.company_id });
    }

    if (filters.licenseKey) {
      subQuery.andWhere('license.license_key LIKE :licenseKey', { licenseKey: `%${filters.licenseKey}%` });
    }

    if (filters.trial) {
      subQuery.andWhere('license.trial = :trial', { trial: filters.trial });
    }

    const totalItems = await subQuery.getCount();

    const ids = await subQuery
      .skip((currentPage - 1) * itemsPerPage)
      .take(itemsPerPage)
      .getRawMany();

    const licenseIds = ids.map(item => item.license_id || item.id);
    if (licenseIds.length === 0) {
      return { items: [], currentPage, totalItems, totalPages: 0 };
    }

    // Step 2: ID 기준 상세 데이터 조회
    const data = await this.licenseRepository
      .createQueryBuilder('license')
      .leftJoin('business', 'business', 'license.business_id = business.id')
      .leftJoin('product', 'product', 'business.product_id = product.id')
      .select([
        'license.id as id',
        'license.license_key as license_key',
        'license.issued as issued',
        'license.expired as expired',
        'license.status as status',
        'license.company_id as company_id',
        'license.approve_user as approve_user',
        'license.approved as approved',
        'license.business_id as business_id',
        'license.issued_id as issued_id',
        'license.trial as trial',
        'license.created as created',
        'license.approved as approved',
        'business.name as business_name',
        'product.name as product_name',
        'product.version as product_version'
      ])
      .whereInIds(licenseIds)
      .orderBy('license.created', 'DESC')
      .getRawMany();

    return {
      items: data,
      currentPage,
      totalItems,
      totalPages: Math.ceil(totalItems / itemsPerPage),
    };
  }

  async findOne(id: number): Promise<License | null> {
    const rawQuery = `
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
        b.id AS business_id,
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

    const [license] = await this.licenseRepository.query(rawQuery, [id]);

    if (!license) return null;

    return {
      ...license,
      created: this.formatDateToYYYYMMDD(license.created),
      approved: this.formatDateToYYYYMMDD(license.approved)
    };
  }

  async findOne_QueryBuilder(id: number): Promise<License | null> {
    const query = this.licenseRepository.createQueryBuilder('license')
      // .leftJoin('product', 'product', 'license.product_id = product.id')
      .leftJoinAndSelect('partner', 'company', 'license.company_id = company.id')
      // .leftJoinAndSelect('partner', 'issuer', 'license.issued_user = issuer.id')
      .leftJoinAndSelect('business', 'business', 'license.business_id = business.id')
      .leftJoinAndSelect('product', 'product', 'business.product_id = product.id')
      .select([
        'license.*',
        // 'product.name as product_name',
        'company.name as company_name',
        'company.telnum as company_telnum',
        'company.level as company_level',
        // 'issuer.name as issuer_company_name',
        // 'issuer.telnum as issuer_company_telnum',
        // 'issuer.level as issuer_company_level',
        'business.id as business_id',
        'business.name as business_name',
        'product.id as product_id',
        'product.name as product_name',
        'product.version as product_version'
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

  async create(data: Partial<License>): Promise<License> {
    if (data.oem === '') {
      data.oem = null;
    }

    //회사이름이 '클로잇'인지 조회하여 'oem'정보변경
    const rawQuery_partner = `
      SELECT 
        name
      FROM partner
      WHERE id = ?
      LIMIT 1
    `;
    const [partner] = await this.licenseRepository.query(rawQuery_partner, [data.company_id]);
    if (partner.name == '클로잇') {
      data.oem = 'clostack';
    } else if (partner.name == '효성') {
      data.oem = 'hv';
    }

    const license = this.licenseRepository.create({
      ...data,
      license_key: uuidv4(),
      issued: data.issued || '0000-00-00',
      expired: data.expired || '0000-00-00',
      approved: new Date().toISOString(),
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

  async update(id: number, updateData: Partial<License>): Promise<License | null> {
    const license = await this.licenseRepository.findOne({ where: { id } })
    if (!license) throw new Error(`License with ID ${id} not found`)
    const updatedLicense = {
      ...license,
      ...updateData,
      issued: updateData.issued || license.issued,
      expired: updateData.expired || license.expired,
    }
    await this.licenseRepository.save(updatedLicense)
    return this.findOne(id)
  }

  async delete(
    id: number
  ): Promise<void> {
    const license = await this.licenseRepository.findOne({ where: { id } })
    if (!license) throw new Error(`License with ID ${id} not found`)

    // license_id를 null로 설정
    if (license.business_id) {
      const business = await this.businessRepository.findOne({
        where: { id: parseInt(license.business_id, 10) },
      });
  
      if (business) {
        business.license_id = null;
        await this.businessRepository.save(business);
      }
    }

    // license 삭제
    await this.licenseRepository.softDelete(id)
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
}