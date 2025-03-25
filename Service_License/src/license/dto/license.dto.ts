export class CreateLicenseDto {
  product_id: string;
  issued?: string;
  expired?: string;
  status?: 'active' | 'inactive' | 'expired';
  product_type?: string;
  cpu_core?: number;
  product_cnt?: number;
  business_type?: 'POC' | 'BMT' | 'TEMP';
  business_name?: string;
  user_type?: string;
  company_id?: number;
  partner_id?: number;
  issued_user?: string;
  approve_user?: string;
  approved?: Date;
}

export class UpdateLicenseDto extends CreateLicenseDto {
  product_type?: string;
  cpu_core?: number;
  product_cnt?: number;
  business_type?: 'POC' | 'BMT' | 'TEMP';
  business_name?: string;
  user_type?: string;
  company_id?: number;
  issued_user?: string;
  approve_user?: string;
  approved?: Date;
}