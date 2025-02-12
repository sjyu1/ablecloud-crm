import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Query } from '@nestjs/common'
import { LicenseService } from './license.service'
import { License } from './license.entity'
import { AuthGuard } from '../auth/auth.guard'

@Controller('license')
@UseGuards(AuthGuard)
export class LicenseController {
  constructor(private readonly licenseService: LicenseService) {}

  @Get()
  async getLicenses(
    @Query() query: { page?: string; limit?: string; productId?: string },
  ): Promise<{ items: License[]; total: number; page: number; totalPages: number }> {
    const page = query.page || '1';
    const limit = query.limit || '10';
    const productId = query.productId || '';

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    if (isNaN(pageNumber) || isNaN(limitNumber)) {
      throw new Error('Invalid page or limit format');
    }

    return this.licenseService.getAllLicenses(pageNumber, limitNumber, productId);
  }

  @Get(':id')
  async getLicenseById(@Param('id') id: string): Promise<License> {
    const numericId = parseInt(id, 10)
    if (isNaN(numericId)) throw new Error('Invalid ID format')
    return this.licenseService.getLicenseById(numericId)
  }

  @Post()
  async createLicense(@Body() createData: Partial<License>): Promise<License> {
    return this.licenseService.createLicense(createData)
  }

  @Put(':id')
  async updateLicense(
    @Param('id') id: string,
    @Body() updateData: Partial<License>,
  ): Promise<License> {
    const numericId = parseInt(id, 10)
    if (isNaN(numericId)) throw new Error('Invalid ID format')
    return this.licenseService.updateLicense(numericId, updateData)
  }

  @Delete(':id')
  async deleteLicense(@Param('id') id: string): Promise<void> {
    const numericId = parseInt(id, 10)
    if (isNaN(numericId)) throw new Error('Invalid ID format')
    await this.licenseService.deleteLicense(numericId)
  }
}