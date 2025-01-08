import { IsString, IsNotEmpty, IsDate } from 'class-validator'

export class CreateLicenseDto {
  @IsString()
  @IsNotEmpty()
  license_key: string;

  @IsString()
  @IsNotEmpty()
  product_id: string;

  @IsDate()
  issued_date: Date;

  @IsDate()
  expiry_date: Date;

  @IsString()
  @IsNotEmpty()
  status: 'active' | 'inactive' | 'expired';
}
