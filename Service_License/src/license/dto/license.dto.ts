export class CreateLicenseDto {
  product_id: string;
  issued?: string;
  expired?: string;
  status?: 'active' | 'inactive' | 'expired';
  business_id?: string;
  company_id?: number;
  issued_id?: string;
  approve_user?: string;
  approved?: Date;
}

export class UpdateLicenseDto extends CreateLicenseDto {
  company_id?: number;
  issued_id?: string;
  approve_user?: string;
  approved?: Date;
}