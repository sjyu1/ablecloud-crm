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

  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    const customer = this.customerRepository.create(createCustomerDto);
    return this.customerRepository.save(customer);
  }

  async findAll(
    page: number,
    limit: number,
    name?: string
  ): Promise<{ customers: Customer[]; total: number }> {
    const queryBuilder = this.customerRepository.createQueryBuilder('customer')
      .where('customer.removed IS NULL');

    if (name) {
      queryBuilder.andWhere('customer.name LIKE :name', { name: `%${name}%` });
    }

    const [customers, total] = await queryBuilder
      .orderBy('customer.created', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { customers, total };
  }

  async getCustomerById(id: number): Promise<Customer | null> {
    const query = this.customerRepository.createQueryBuilder('customer')
      .leftJoin('business', 'business', 'customer.id = business.customer_id')
      .select([
        'customer.*',
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
      business_name: customer.business_name,
      business_status: customer.business_status,
      business_node_cnt: customer.business_node_cnt,
      business_core_cnt: customer.business_core_cnt,
      business_issued: customer.business_issued,
      business_expired: customer.business_expired,
    };
  }

  async findOne(id: number): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id },
      withDeleted: false
    });

    if (!customer) {
      throw new NotFoundException(`고객 ID ${id}를 찾을 수 없습니다.`);
    }

    return customer;
  }

  async update(id: number, updateCustomerDto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.findOne(id);
    const updatedCustomer = {
      ...customer,
      ...updateCustomerDto,
    };
    return this.customerRepository.save(updatedCustomer);
  }

  async remove(id: number): Promise<void> {
    const customer = await this.findOne(id);
    await this.customerRepository.softDelete(id);
  }
}