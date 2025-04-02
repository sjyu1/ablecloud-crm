export class CreateLicenseDto {
  issued?: string;
  expired?: string;
  status?: 'active' | 'inactive' | 'expired';
  business_id?: string;
  company_id?: number;
  issued_id?: string;
  approve_user?: string;
  approved?: Date;
  trial?: boolean;
}

export class UpdateLicenseDto extends CreateLicenseDto {
  company_id?: number;
  issued_id?: string;
  approve_user?: string;
  approved?: Date;
  trial?: boolean;
}