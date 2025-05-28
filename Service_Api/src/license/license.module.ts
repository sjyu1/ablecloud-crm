import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { License } from './license.entity';
import { Business } from '../business/business.entity';
import { LicenseService } from './license.service';
import { LicenseController } from './license.controller';
import { AuthGuard } from '../auth/auth.guard'
import { HttpModule } from '@nestjs/axios'

@Module({
  imports: [HttpModule, TypeOrmModule.forFeature([License, Business])],
  controllers: [LicenseController],
  providers: [LicenseService, AuthGuard],
})
export class LicenseModule {}