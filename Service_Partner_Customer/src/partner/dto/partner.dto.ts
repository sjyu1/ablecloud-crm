export class CreatePartnerDto {
  name: string;
  telnum: string;
  level: 'PLATINUM' | 'GOLD' | 'VAD';
}

export class UpdatePartnerDto {
  name?: string;
  telnum?: string;
  level?: 'PLATINUM' | 'GOLD' | 'VAD';
}