import { IsString, IsNotEmpty, IsDate, IsOptional, IsEnum, IsNumber, Min } from 'class-validator'

export class CreateLicenseDto {
  @IsString()
  @IsNotEmpty()
  license_key: string;

  @IsString()
  @IsNotEmpty()
  product_id: string;

  @IsDate()
  issued: Date;

  @IsDate()
  expired: Date;

  @IsEnum(['active', 'inactive', 'expired'])
  @IsNotEmpty()
  status: 'active' | 'inactive' | 'expired';

  @IsString()
  @IsOptional()
  product_type: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  cpu_core: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  product_cnt: number;

  @IsEnum(['POC', 'BMT', 'TEMP'])
  @IsOptional()
  business_type: 'POC' | 'BMT' | 'TEMP';

  @IsString()
  @IsOptional()
  business_name: string;

  @IsString()
  @IsOptional()
  user_type: string;

  @IsNumber()
  @IsOptional()
  company_id: number;
}