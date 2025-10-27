import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './customer.entity';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async findAll(
    currentPage: number = 1,
    itemsPerPage: number = 10,
    filters: {
      name?: string;
      manager_company?: string;
      company_id?: string;
      order?: string;
    }
  ): Promise<{ data: Customer[]; pagination: {} }> {
    const offset = (currentPage - 1) * itemsPerPage;
  
    // 필터 조건
    const whereConditions: string[] = ['c.removed IS NULL'];
    const params: any[] = [];

    if (filters.name) {
      whereConditions.push('c.name LIKE ?');
      params.push(`%${filters.name}%`);
    }

    if (filters.manager_company) {
      if (filters.manager_company == 'ABLECLOUD'){
        whereConditions.push('(type_attr.value IS NULL OR type_attr.value != "partner")');
      } else {
        whereConditions.push('type_attr.value = "partner" AND partner.name LIKE ?');
        params.push(`%${filters.manager_company}%`);
      }
    }

    if (filters.company_id) {
      whereConditions.push(`company_attr.value = ?`);
      params.push(filters.company_id);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // ORDER BY 처리
    const orderByClause = filters.order ? 'ORDER BY c.name ASC' : 'ORDER BY c.created DESC';

    // Step 1: 전체 개수 조회
    const countQuery = `
      SELECT COUNT(*) AS count
      FROM customer c
      LEFT JOIN keycloak.USER_ENTITY u
        ON c.manager_id = u.id
      LEFT JOIN keycloak.USER_ATTRIBUTE company_attr
        ON u.id = company_attr.user_id
        AND company_attr.name = 'company_id'
      LEFT JOIN keycloak.USER_ATTRIBUTE type_attr
        ON u.id = type_attr.user_id
        AND type_attr.name = 'type'
        AND type_attr.value IN ('partner', 'vendor')
      LEFT JOIN partner
        ON company_attr.value = CAST(partner.id AS CHAR)
      ${whereClause}
    `;
    const countResult = await this.customerRepository.query(countQuery, params);
    const totalItems = countResult[0]?.count || 0;

    // Step 2: 데이터가 없으면 빈 배열 반환
    if (totalItems === 0) {
      return { 
        data: [],
        pagination: {
          currentPage: currentPage,
          totalItems: totalItems,
          totalPages: 0,
          itemsPerPage: itemsPerPage,
        },
      };
    }

    // Step 3: 데이터 조회
    const rawQuery = `
      SELECT 
        c.id AS id,
        c.name AS name,
        c.telnum AS telnum,
        c.manager_id AS manager_id,
        c.created AS created,
        u.username AS manager_name,
        CASE 
          WHEN type_attr.value = 'partner' THEN partner.name 
          ELSE 'ABLECLOUD' 
        END AS manager_company
      FROM customer c
      LEFT JOIN keycloak.USER_ENTITY u
        ON c.manager_id = u.id
      LEFT JOIN keycloak.USER_ATTRIBUTE company_attr
        ON u.id = company_attr.user_id
        AND company_attr.name = 'company_id'
      LEFT JOIN keycloak.USER_ATTRIBUTE type_attr
        ON u.id = type_attr.user_id
        AND type_attr.name = 'type'
        AND type_attr.value IN ('partner', 'vendor')
      LEFT JOIN partner
        ON company_attr.value = CAST(partner.id AS CHAR)
      ${whereClause}
      ${orderByClause}
      LIMIT ? OFFSET ?
    `;

    const result = await this.customerRepository.query(rawQuery, [...params, itemsPerPage, offset]);

    return {
      data: result,
      pagination: {
        currentPage: currentPage,
        totalItems: totalItems,
        totalPages: Math.ceil(totalItems / itemsPerPage),
        itemsPerPage: itemsPerPage,
      },
    };
  }

  async findOne(id: number): Promise<{ data: Customer[]; }> {
    const rawQuery = `
      SELECT
        c.id AS id,
        c.name AS name,
        c.telnum AS telnum,
        c.manager_id AS manager_id,
        c.created AS created,

        b.id AS business_id,
        b.name AS business_name,
        b.status AS business_status,
        b.node_cnt AS business_node_cnt,
        b.core_cnt AS business_core_cnt,
        b.issued AS business_issued,
        b.expired AS business_expired,

        u.username AS manager_name,

        CASE 
          WHEN type_attr.value = 'partner' THEN partner.name
          ELSE 'ABLECLOUD'
        END AS manager_company

      FROM customer c

      -- 관련 사업 정보 (nullable)
      LEFT JOIN business b 
        ON c.id = b.customer_id

      -- 고객 담당자 유저 정보
      LEFT JOIN keycloak.USER_ENTITY u 
        ON c.manager_id = u.id

      -- 담당자 회사 ID
      LEFT JOIN keycloak.USER_ATTRIBUTE company_attr 
        ON u.id = company_attr.user_id 
        AND company_attr.name = 'company_id'

      -- 담당자 유형 정보 (partner/vendor 중 하나만)
      LEFT JOIN keycloak.USER_ATTRIBUTE type_attr 
        ON u.id = type_attr.user_id 
        AND type_attr.name = 'type' 
        AND type_attr.value IN ('partner', 'vendor')

      -- 파트너 정보 (담당자 유형이 partner일 경우)
      LEFT JOIN partner 
        ON company_attr.value = CAST(partner.id AS CHAR)

      -- 특정 고객 조회
      WHERE c.id = ?

    `;

    const [customer] = await this.customerRepository.query(rawQuery, [id]);

    return {
      data: customer || null,
    };
  }

  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    const customer = this.customerRepository.create(createCustomerDto);
    return this.customerRepository.save(customer);
  }

  async update(id: number, updateCustomerDto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.findOne(id);
    const updatedCustomer = {
      ...customer,
      ...updateCustomerDto,
    };
    return this.customerRepository.save(updatedCustomer);
  }

  async delete(id: number): Promise<void> {
    const customer = await this.findOne(id);
    await this.customerRepository.softDelete(id);
  }
}