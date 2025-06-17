import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Query, Request } from '@nestjs/common'
import { LicenseService } from './license.service'
import { License } from './license.entity'
import { AuthGuard } from '../auth/auth.guard'
import { RolesGuard } from '../auth/role/role.guard'
// import { Roles } from 'src/auth/role/role.decorator'

@UseGuards(AuthGuard, RolesGuard)
@Controller('license')
@UseGuards(AuthGuard)
export class LicenseController {
  constructor(private readonly licenseService: LicenseService) {}

  @Get()
  // @Roles('Admin', 'User')
  async findAll(
    @Query('page') currentPage = '1',
    @Query('limit') itemsPerPage = '10',
    @Query('productId') productId?: string,
    @Query('businessType') businessType?: string,
    @Query('company_id') company_id?: string,
    @Query('trial') trial?: string,
    @Query('business_name') business_name?: string,
    @Query('license_key') license_key?: string,
    @Query('status') status?: string,
  ): Promise<{ items: License[]; currentPage: number; totalItems: number; totalPages: number }> {
    const filters = {
      productId: productId || '',
      businessType: businessType || '',
      company_id: company_id || '',
      trial: trial || '0',
      business_name: business_name || '',
      license_key: license_key || '',
      status: status || ''
    };

    return this.licenseService.findAll(parseInt(currentPage, 10), parseInt(itemsPerPage, 10), filters);
  }

  @Get(':id')
  // @Roles('Admin', 'User')
  async findOne(@Param('id') id: string): Promise<License> {
    return this.licenseService.findOne(parseInt(id, 10))
  }

  @Post()
  // @Roles('Admin')
  async create(@Body() createData: Partial<License>): Promise<License> {
    return this.licenseService.create(createData)
  }

  @Put(':id')
  // @Roles('Admin')
  async update(
    @Param('id') id: string,
    @Body() updateData: Partial<License>,
  ): Promise<License> {
    return this.licenseService.update(parseInt(id, 10), updateData)
  }

  @Delete(':id')
  // @Roles('Admin')
  async delete(
    @Param('id') id: string
  ): Promise<void> {
    await this.licenseService.delete(parseInt(id, 10))
  }

  @Put(':id/approve')
  // @Roles('Admin')
  async approveLicense(
    @Param('id') id: string,
    @Body('approve_user') approveUser: string,
  ): Promise<License> {
    return this.licenseService.approveLicense(parseInt(id, 10), approveUser);
  }
}