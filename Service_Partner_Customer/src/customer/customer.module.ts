import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { Customer } from './customer.entity';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/role/role.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer]),
    HttpModule,
  ],
  controllers: [CustomerController],
  providers: [CustomerService, AuthGuard, RolesGuard],
  exports: [CustomerService],
})
export class CustomerModule {}