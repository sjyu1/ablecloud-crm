import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User, 'keycloak')
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(
    currentPage: number = 1,
    itemsPerPage: number = 10,
    filters: {
      username?: string;
      firstName?: string;
      company?: string;
      company_id?: string;
      manager_id?: string;
      type?: string;
    }
  ): Promise<{ items: User[]; currentPage: number; totalItems: number; totalPages: number }> {
    const offset = (currentPage - 1) * itemsPerPage;

    const whereConditions: string[] = [];
    const params: any[] = [];

    if (filters.username) {
      whereConditions.push('u.username LIKE ?');
      params.push(`%${filters.username}%`);
    }

    if (filters.firstName) {
      whereConditions.push('u.first_name LIKE ?');
      params.push(`%${filters.firstName}%`);
    }

    if (filters.company) {
      if (filters.company == 'ABLECLOUD'){
        whereConditions.push('(type_attr.value IS NULL OR type_attr.value != "partner")');
      } else {
        whereConditions.push('type_attr.value = "partner" AND partner.name LIKE ?');
        params.push(`%${filters.company}%`);
      }
    }

    if (filters.type) {
      whereConditions.push(`type_attr.value = ?`);
      params.push(filters.type);
    }

    if (filters.company_id && filters.type === 'partner') {
      whereConditions.push(`company_attr.value = ?`);
      params.push(filters.company_id);
    }

    if (filters.company_id && filters.type === 'customer') {
      whereConditions.push(`p.manager_company_id = ?`);
      params.push(filters.company_id);
    }

    

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Step 1: total 데이터 조회
    const countQuery = `
      SELECT COUNT(*) AS count
      FROM keycloak.USER_ENTITY u
      LEFT JOIN keycloak.USER_ATTRIBUTE company_attr
        ON u.id = company_attr.user_id
        AND company_attr.name = 'company_id'
      LEFT JOIN keycloak.USER_ATTRIBUTE type_attr
        ON u.id = type_attr.user_id
        AND type_attr.name = 'type'
      LEFT JOIN licenses.${filters.type === 'partner' ? 'partner' : 'customer'} p
        ON company_attr.value = CAST(p.id AS CHAR)
      ${whereClause}
    `;

    const countResult = await this.userRepository.query(countQuery, params);
    const totalItems = countResult[0]?.count || 0;

    if (totalItems === 0) {
      return { items: [], currentPage, totalItems, totalPages: 0 };
    }

    // Step 2: 실제 데이터 조회
    // const caseType = filters.type === 'partner' ? 'partner' : 'customer';
    // const companyJoinTable = filters.type === 'partner' ? 'licenses.partner' : 'licenses.customer';
    const rawQuery = `
      SELECT 
        u.id AS id,
        u.username AS username,
        u.email AS email,
        u.first_name AS firstName,
        type_attr.value AS type,
        telnum_attr.value AS telnum,
        r_def.name AS role,
        company_attr.value AS company_id,
        CASE 
          WHEN type_attr.value = '${filters.type === 'partner' ? 'partner' : 'customer'}' THEN p.name 
          ELSE 'ABLECLOUD' 
        END AS company
      FROM keycloak.USER_ENTITY u
      LEFT JOIN keycloak.USER_ATTRIBUTE company_attr
        ON u.id = company_attr.user_id
        AND company_attr.name = 'company_id'
      LEFT JOIN keycloak.USER_ATTRIBUTE type_attr
        ON u.id = type_attr.user_id
        AND type_attr.name = 'type'
      LEFT JOIN keycloak.USER_ATTRIBUTE telnum_attr
        ON u.id = telnum_attr.user_id
        AND telnum_attr.name = 'telnum'
      INNER JOIN keycloak.USER_ROLE_MAPPING r
        ON u.id = r.user_id
      INNER JOIN keycloak.KEYCLOAK_ROLE r_def
        ON r.role_id = r_def.id
        AND r_def.name IN ('Admin', 'User')
      LEFT JOIN licenses.${filters.type === 'partner' ? 'partner' : 'customer'} p
        ON company_attr.value = CAST(p.id AS CHAR)
      ${whereClause}
      ORDER BY u.created_timestamp DESC
      LIMIT ? OFFSET ?
    `;

    const data = await this.userRepository.query(rawQuery, [...params, itemsPerPage, offset]);

    return {
      items: data,
      currentPage,
      totalItems,
      totalPages: Math.ceil(totalItems / itemsPerPage),
    };
  }

  async findOne(id: string): Promise<User | null> {
    const rawQuery = `
      SELECT 
        u.id AS id,
        u.username AS username,
        u.email AS email,
        u.first_name AS firstName,
        type_attr.value AS type,
        telnum_attr.value AS telnum,
        company_attr.value AS company_id,
        r_def.name AS role,
        CASE 
          WHEN type_attr.value = 'partner' THEN partner.name
          WHEN type_attr.value = 'customer' THEN customer.name
          ELSE 'ABLECLOUD'
        END AS company
      FROM keycloak.USER_ENTITY u
      LEFT JOIN keycloak.USER_ATTRIBUTE company_attr
        ON u.id = company_attr.user_id
        AND company_attr.name = 'company_id'
      LEFT JOIN keycloak.USER_ATTRIBUTE type_attr
        ON u.id = type_attr.user_id
        AND type_attr.name = 'type'
      LEFT JOIN keycloak.USER_ATTRIBUTE telnum_attr
        ON u.id = telnum_attr.user_id
        AND telnum_attr.name = 'telnum'
      INNER JOIN keycloak.USER_ROLE_MAPPING r
        ON u.id = r.user_id
      INNER JOIN keycloak.KEYCLOAK_ROLE r_def
        ON r.role_id = r_def.id
        AND r_def.name IN ('Admin', 'User')
      LEFT JOIN licenses.partner partner
        ON type_attr.value = 'partner'
        AND company_attr.value = CAST(partner.id AS CHAR)
      LEFT JOIN licenses.customer customer
        ON type_attr.value = 'customer'
        AND company_attr.value = CAST(customer.id AS CHAR)
      WHERE 
        u.id = ?
    `;
    
    const result = await this.userRepository.query(rawQuery, [id]);

    const user = result[0];
    if (!user) return null;

    return {
      ...user
    };

  }

  async findAllForManager(
    // currentPage: number = 1,
    // itemsPerPage: number = 10,
    filters: {
      name?: string;
      type?: string;
      company_id?: string;
    }
  ): Promise<{ items: User[]; }> {
    const rawQuery = `
      SELECT 
        u.id AS id,
        u.username AS username,
        company_attr.value AS company_id,
        type_attr.value AS test,
        CASE 
          WHEN type_attr.value = 'partner' THEN p.name 
          ELSE 'ABLECLOUD' 
        END AS company,
        cr.deposit AS deposit,
        cr.credit AS credit
      FROM keycloak.USER_ENTITY u
      LEFT JOIN keycloak.USER_ATTRIBUTE company_attr
        ON u.id = company_attr.user_id
        AND company_attr.name = 'company_id'
      LEFT JOIN keycloak.USER_ATTRIBUTE type_attr
        ON u.id = type_attr.user_id
        AND type_attr.name = 'type'
        AND type_attr.value IN ('partner', 'vendor')
      LEFT JOIN licenses.partner p
        ON company_attr.value = CAST(p.id AS CHAR)
      LEFT JOIN (
        SELECT partner_id, SUM(deposit) AS deposit, SUM(credit) AS credit
        FROM licenses.credit
        GROUP BY partner_id
      ) cr ON p.id = cr.partner_id
      WHERE company_attr.id IS NOT NULL
        AND type_attr.id IS NOT NULL
        ${filters.type ? `AND type_attr.value = '${filters.type}'` : ''}
        ${filters.company_id ? `AND company_attr.value = '${filters.company_id}'` : ''}
    `;

    const data = await this.userRepository.query(rawQuery);

    return {
      items: data
    };
  }
}