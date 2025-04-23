import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { PartnerService } from './partner.service';
import { Partner } from './partner.entity';
import { CreatePartnerDto, UpdatePartnerDto } from './dto/partner.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/role/role.guard';
// import { Roles } from 'src/auth/role/role.decorator';

@UseGuards(AuthGuard, RolesGuard)
@Controller('partner')
export class PartnerController {
  constructor(private readonly partnerService: PartnerService) {}

  @Post()
  // @Roles('Admin')
  async create(@Body() createPartnerDto: CreatePartnerDto): Promise<Partner> {
    return this.partnerService.create(createPartnerDto);
  }

  @Get()
  // @Roles('Admin')
  async findAllHttp(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('level') level?: 'PLATINUM' | 'GOLD' | 'SILVER' | 'VAR',
    @Query('name') name?: string,
    @Query('id') id?: string
  ) {
    try {
      // 파라미터 유효성 검사
      const validPage = Math.max(1, Number(page));
      const validLimit = Math.max(1, Number(limit));

      const validId = id && id !== 'undefined' && id !== '' ? id : undefined;

      // name이 유효한 문자열인지 확인
      const validName = name && name !== 'undefined' && name !== '' ? name : undefined;

      // level이 유효한 값인지 확인
      const validLevel = level && ['PLATINUM', 'GOLD', 'SILVER', 'VAR'].includes(level) ? level : undefined;

      return await this.partnerService.findAll(validPage, validLimit, validLevel, validName, validId);
    } catch (error) {
      //console.error('파트너 검색 요청 처리 중 오류 발생:', error);
      throw error;
    }
  }

  @Get(':id')
  // @Roles('Admin')
  async findOneHttp(@Param('id') id: number) {
    return this.partnerService.findOne(id);
  }

  @Put(':id')
  // @Roles('Admin')
  async update(
    @Param('id') id: string,
    @Body() updatePartnerDto: UpdatePartnerDto
  ): Promise<Partner> {
    return this.partnerService.update(parseInt(id, 10), updatePartnerDto);
  }

  @Delete(':id')
  // @Roles('Admin')
  async remove(@Param('id') id: string): Promise<void> {
    return this.partnerService.remove(parseInt(id, 10));
  }

  @MessagePattern({ cmd: 'get_partners' })
  async findAll(data: {
    page: number;
    limit: number;
    level?: 'PLATINUM' | 'GOLD' | 'SILVER' | 'VAR';
    name?: string;
  }) {
    const { page = 1, limit = 10, level, name } = data;
    return this.partnerService.findAll(page, limit, level, name);
  }

  @MessagePattern({ cmd: 'get_partner' })
  async findOne(id: number) {
    return this.partnerService.findOne(id);
  }
}