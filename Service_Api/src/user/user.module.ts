import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { User } from './user.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/role/role.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User], 'keycloak'),
    HttpModule,
  ],
  controllers: [UserController],
  providers: [UserService, AuthGuard, RolesGuard],
  exports: [UserService],
})
export class UserModule {}
