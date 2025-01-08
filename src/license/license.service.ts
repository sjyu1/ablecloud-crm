import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { License } from './license.entity'
import { v4 as uuidv4 } from 'uuid'

@Injectable()
export class LicenseService {
  constructor(
    @InjectRepository(License)
    private readonly licenseRepository: Repository<License>,
  ) {}

  private formatDateToYYYYMMDD(date: string | Date): string {
    if (!date) return '0000-00-00'
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  private removeMicrosecondsFromTimestamp(timestamp: string | Date): string {
    const date = new Date(timestamp)
    return date.toISOString().replace(/\.\d{3}Z$/, 'Z')
  }

  async getAllLicenses(): Promise<License[]> {
    const licenses = await this.licenseRepository.find()
    return licenses.map(license => ({
      ...license,
      issued_date: this.formatDateToYYYYMMDD(license.issued_date),
      expiry_date: this.formatDateToYYYYMMDD(license.expiry_date),
      created_at: this.removeMicrosecondsFromTimestamp(license.created_at),
      updated_at: this.removeMicrosecondsFromTimestamp(license.updated_at),
    }))
  }

  async getLicenseById(id: number): Promise<License | null> {
    const license = await this.licenseRepository.findOne({ where: { id } })
    if (!license) return null
    return {
      ...license,
      issued_date: this.formatDateToYYYYMMDD(license.issued_date),
      expiry_date: this.formatDateToYYYYMMDD(license.expiry_date),
      created_at: this.removeMicrosecondsFromTimestamp(license.created_at),
      updated_at: this.removeMicrosecondsFromTimestamp(license.updated_at),
    }
  }

  async createLicense(data: Partial<License>): Promise<License> {
    const license = this.licenseRepository.create({
      ...data,
      license_key: uuidv4(),
      issued_date: data.issued_date || '0000-00-00',
      expiry_date: data.expiry_date || '0000-00-00',
    })
    const savedLicense = await this.licenseRepository.save(license)
    return {
      ...savedLicense,
      issued_date: this.formatDateToYYYYMMDD(savedLicense.issued_date),
      expiry_date: this.formatDateToYYYYMMDD(savedLicense.expiry_date),
      created_at: this.removeMicrosecondsFromTimestamp(savedLicense.created_at),
      updated_at: this.removeMicrosecondsFromTimestamp(savedLicense.updated_at),
    }
  }

  async updateLicense(id: number, updateData: Partial<License>): Promise<License | null> {
    const license = await this.licenseRepository.findOne({ where: { id } })
    if (!license) throw new Error(`License with ID ${id} not found`)
    const updatedLicense = {
      ...license,
      ...updateData,
      issued_date: updateData.issued_date || license.issued_date,
      expiry_date: updateData.expiry_date || license.expiry_date,
    }
    await this.licenseRepository.save(updatedLicense)
    return this.getLicenseById(id)
  }

  async deleteLicense(id: number): Promise<void> {
    const license = await this.licenseRepository.findOne({ where: { id } })
    if (!license) throw new Error(`License with ID ${id} not found`)
    await this.licenseRepository.delete(id)
  }
}
