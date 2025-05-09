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

  async findAll_noLimit(
  ): Promise<{ items: Customer[]; }> {
    const data = await this.customerRepository
      .createQueryBuilder('customer')
      .select([
        'customer.id as id',
        'customer.name as name',
        'customer.telnum as telnum',
        'customer.manager_id as manager_id',
        'customer.created as created',
      ])
      // .whereInIds(customerIds)
      .orderBy('customer.created', 'DESC')
      .getRawMany();

    return {
      items: data
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