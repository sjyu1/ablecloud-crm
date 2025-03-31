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
  async getLicenses(
    @Query() query: { 
      page?: string; 
      limit?: string; 
      productId?: string;
      businessType?: string;
      company_id?: string;
    },
    @Request() req: any
  ): Promise<{ items: License[]; total: number; page: number; totalPages: number }> {
    const page = query.page || '1';
    const limit = query.limit || '10';
    
    const partnerId = req.user?.partnerId;

    const filters = {
      productId: query.productId || '',
      businessType: query.businessType || '',
      company_id: query.company_id || '',
      partnerId: partnerId
    };

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    if (isNaN(pageNumber) || isNaN(limitNumber)) {
      throw new Error('Invalid page or limit format');
    }

    return this.licenseService.getAllLicenses(pageNumber, limitNumber, filters);
  }

  @Get(':id')
  // @Roles('Admin', 'User')
  async getLicenseById(@Param('id') id: string): Promise<License> {
    const numericId = parseInt(id, 10)
    if (isNaN(numericId)) throw new Error('Invalid ID format')
    return this.licenseService.getLicenseById(numericId)
  }

  @Post()
  // @Roles('Admin')
  async createLicense(@Body() createData: Partial<License>): Promise<License> {
    return this.licenseService.createLicense(createData)
  }

  @Put(':id')
  // @Roles('Admin')
  async updateLicense(
    @Param('id') id: string,
    @Body() updateData: Partial<License>,
  ): Promise<License> {
    const numericId = parseInt(id, 10)
    if (isNaN(numericId)) throw new Error('Invalid ID format')
    return this.licenseService.updateLicense(numericId, updateData)
  }

  @Delete(':id')
  // @Roles('Admin')
  async deleteLicense(@Param('id') id: string): Promise<void> {
    const numericId = parseInt(id, 10)
    if (isNaN(numericId)) throw new Error('Invalid ID format')
    await this.licenseService.deleteLicense(numericId)
  }

  @Put(':id/approve')
  // @Roles('Admin')
  async approveLicense(
    @Param('id') id: string,
    @Body('approve_user') approveUser: string,
  ): Promise<License> {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) throw new Error('Invalid ID format');
    return this.licenseService.approveLicense(numericId, approveUser);
  }
}