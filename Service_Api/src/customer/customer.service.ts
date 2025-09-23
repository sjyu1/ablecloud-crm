import { Injectable, NotFoundException } from '@nestjs/common';
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
    }
  ): Promise<{ items: Customer[]; currentPage: number; totalItems: number; totalPages: number }> {
    const offset = (currentPage - 1) * itemsPerPage;

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

    // Step 1: total 데이터 조회
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

    if (totalItems === 0) {
      return { items: [], currentPage, totalItems, totalPages: 0 };
    }

    // Step 2: 실제 데이터 조회
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
      ORDER BY c.created DESC
      LIMIT ? OFFSET ?
    `;

    const data = await this.customerRepository.query(rawQuery, [...params, itemsPerPage, offset]);

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
      name?: string;
    }
  ): Promise<{ items: Customer[]; currentPage: number; totalItems: number; totalPages: number }> {
    // Step 1: ID만 추출
    const subQuery = this.customerRepository.createQueryBuilder('customer')
      .select('customer.id', 'id')
      .where('customer.removed IS NULL')
      .orderBy('customer.created', 'DESC');

    if (filters.name) {
      subQuery.andWhere('customer.name LIKE :name', { name: `%${filters.name}%` });
    }

    const totalItems = await subQuery.getCount();

    const ids = await subQuery
      .skip((currentPage - 1) * itemsPerPage)
      .take(itemsPerPage)
      .getRawMany();

    const customerIds = ids.map(item => item.customer_id || item.id);
    if (customerIds.length === 0) {
      return { items: [], currentPage, totalItems, totalPages: 0 };
    }

    // Step 2: ID 기준 상세 데이터 조회
    const data = await this.customerRepository
      .createQueryBuilder('customer')
      .select([
        'customer.id as id',
        'customer.name as name',
        'customer.telnum as telnum',
        'customer.manager_id as manager_id',
        'customer.created as created',
      ])
      .whereInIds(customerIds)
      .orderBy('customer.created', 'DESC')
      .getRawMany();

    return {
      items: data,
      currentPage,
      totalItems,
      totalPages: Math.ceil(totalItems / itemsPerPage),
    };
  }

  async findOne(id: number): Promise<Customer | null> {
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
      LEFT JOIN business b ON c.id = b.customer_id
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
      WHERE c.id = ?
    `;

    const result = await this.customerRepository.query(rawQuery, [id]);

    const customer = result[0];
    if (!customer) return null;

    return {
      ...customer,
      // business_id: customer.business_id,
      // business_name: customer.business_name,
      // business_status: customer.business_status,
      // business_node_cnt: customer.business_node_cnt,
      // business_core_cnt: customer.business_core_cnt,
      // business_issued: customer.business_issued,
      // business_expired: customer.business_expired,
    };

  }

  async findOne_QueryBuilder(id: number): Promise<Customer | null> {
    const query = this.customerRepository.createQueryBuilder('customer')
      .leftJoin('business', 'business', 'customer.id = business.customer_id')
      .select([
        'customer.id as id',
        'customer.name as name',
        'customer.telnum as telnum',
        'customer.manager_id as manager_id',
        'customer.created as created',
        'business.id as business_id',
        'business.name as business_name',
        'business.status as business_status',
        'business.node_cnt as business_node_cnt',
        'business.core_cnt as business_core_cnt',
        'business.issued as business_issued',
        'business.expired as business_expired',
      ])
      .where('customer.id = :id', { id });

    const customer = await query.getRawOne();
    if (!customer) return null;

    return {
      ...customer,
      business_id: customer.business_id,
      business_name: customer.business_name,
      business_status: customer.business_status,
      business_node_cnt: customer.business_node_cnt,
      business_core_cnt: customer.business_core_cnt,
      business_issued: customer.business_issued,
      business_expired: customer.business_expired,
    };
  }

  // async findAll_noLimit(
  // ): Promise<{ items: Customer[]; }> {
  //   const data = await this.customerRepository
  //     .createQueryBuilder('customer')
  //     .select([
  //       'customer.id as id',
  //       'customer.name as name',
  //       'customer.telnum as telnum',
  //       'customer.manager_id as manager_id',
  //       'customer.created as created',
  //     ])
  //     // .whereInIds(customerIds)
  //     .orderBy('customer.created', 'DESC')
  //     .getRawMany();

  //   return {
  //     items: data
  //   };
  // }

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