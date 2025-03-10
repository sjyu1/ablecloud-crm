export class CreateLicenseDto {
  product_id: string;
  issued_date?: string;
  expiry_date?: string;
  status?: 'active' | 'inactive' | 'expired';
  type?: string;
  core?: number;
}

export class UpdateLicenseDto extends CreateLicenseDto {}