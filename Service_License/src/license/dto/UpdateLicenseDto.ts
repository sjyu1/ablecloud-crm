import { PartialType } from '@nestjs/mapped-types'
import { CreateLicenseDto } from './CreateLicenseDto'

export class UpdateLicenseDto extends PartialType(CreateLicenseDto) {}
