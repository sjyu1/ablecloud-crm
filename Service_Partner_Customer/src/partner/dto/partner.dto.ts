export class CreatePartnerDto {
  name: string;
  telnum: string;
  level: 'PLATINUM' | 'GOLD' | 'SILVER' | 'VAR';
}

export class UpdatePartnerDto {
  name?: string;
  telnum?: string;
  level?: 'PLATINUM' | 'GOLD' | 'SILVER' | 'VAR';
}