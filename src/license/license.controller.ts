import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards } from '@nestjs/common'
import { LicenseService } from './license.service'
import { License } from './license.entity'
import { AuthGuard } from '../auth/auth.guard'

@Controller('license')
@UseGuards(AuthGuard)
export class LicenseController {
  constructor(private readonly licenseService: LicenseService) {}

  @Get()
  async getLicenses(): Promise<License[]> {
    return this.licenseService.getAllLicenses()
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
