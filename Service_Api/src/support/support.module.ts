import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { Support } from './support.entity';
import { SupportService } from './support.service';
import { SupportController } from './support.controller';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/role/role.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Support]),
    HttpModule,
  ],
  controllers: [SupportController],
  providers: [SupportService, AuthGuard, RolesGuard],
  exports: [SupportService],
})
export class SupportModule {}