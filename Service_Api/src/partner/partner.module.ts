import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { Partner } from './partner.entity';
import { PartnerService } from './partner.service';
import { PartnerController } from './partner.controller';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/role/role.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Partner]),
    HttpModule,
  ],
  controllers: [PartnerController],
  providers: [PartnerService, AuthGuard, RolesGuard],
  exports: [PartnerService],
})
export class PartnerModule {}