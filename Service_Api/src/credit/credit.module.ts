import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { Credit } from './credit.entity';
import { CreditService } from './credit.service';
import { CreditController } from './credit.controller';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/role/role.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Credit]),
    HttpModule,
  ],
  controllers: [CreditController],
  providers: [CreditService, AuthGuard, RolesGuard],
  exports: [CreditService],
})
export class CreditModule {}
