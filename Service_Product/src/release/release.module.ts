import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { Release } from './release.entity';
import { ReleaseService } from './release.service';
import { ReleaseController } from './release.controller';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/role/role.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Release]),
    HttpModule,
  ],
  controllers: [ReleaseController],
  providers: [ReleaseService, AuthGuard, RolesGuard],
  exports: [ReleaseService],
})
export class ReleaseModule {}
