export class CreateBusinessDto {
  name: string;
  issued: string;
  expired: string;
  history: string;
  license_key: string;
  product_version: string;
}

export class UpdateBusinessDto {
  name?: string;
  issued?: string;
  expired?: string;
  history?: string;
  license_key?: string;
  product_version?: string;
}