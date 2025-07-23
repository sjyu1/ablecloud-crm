export class CreatePartnerDto {
  name: string;
  telnum: string;
  level: 'PLATINUM' | 'GOLD' | 'SILVER' | 'VAR';
  product_category: string;
  // deposit_use: boolean;
  // deposit: number;
  // credit: number;
}

export class UpdatePartnerDto {
  name?: string;
  telnum?: string;
  level?: 'PLATINUM' | 'GOLD' | 'SILVER' | 'VAR';
  product_category: string;
  // deposit_use: boolean;
  // deposit: string;
  // credit: string;
}