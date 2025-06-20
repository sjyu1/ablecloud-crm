export class CreatePartnerDto {
  name: string;
  telnum: string;
  level: 'PLATINUM' | 'GOLD' | 'SILVER' | 'VAR';
  deposit_use: boolean;
  deposit: number;
  credit: number;
  product_category: string;
}

export class UpdatePartnerDto {
  name?: string;
  telnum?: string;
  level?: 'PLATINUM' | 'GOLD' | 'SILVER' | 'VAR';
  // deposit_use: boolean;
  // deposit: string;
  // credit: string;
}