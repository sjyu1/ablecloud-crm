import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { Business } from './business.entity';
import { Business_history } from './business_history.entity';
import { Partner } from '../partner/partner.entity';
import { BusinessService } from './business.service';
import { BusinessController } from './business.controller';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/role/role.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Business, Partner, Business_history]),
    HttpModule,
  ],
  controllers: [BusinessController],
  providers: [BusinessService, AuthGuard, RolesGuard],
  exports: [BusinessService],
})
export class BusinessModule {}