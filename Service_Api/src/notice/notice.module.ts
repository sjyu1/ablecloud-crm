import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { Notice } from './notice.entity';
import { NoticeService } from './notice.service';
import { NoticeController } from './notice.controller';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/role/role.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notice]),
    HttpModule,
  ],
  controllers: [NoticeController],
  providers: [NoticeService, AuthGuard, RolesGuard],
  exports: [NoticeService],
})
export class NoticeModule {}
