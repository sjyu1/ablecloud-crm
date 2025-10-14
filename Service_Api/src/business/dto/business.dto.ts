export class CreateBusinessDto {
  name: string;
  issued: string;
  expired: string;
  history: string;
  license_id: string;
  customer_id: number;
  manager_id: string;
  status: string;
  core_cnt: number;
  node_cnt: number;
  product_id?: string;
  details: string;
  deposit_use: boolean;
  credit: number;
  partner_id: string;
}

export class UpdateBusinessDto {
  name?: string;
  issued?: string;
  expired?: string;
  history?: string;
  license_id?: string;
  customer_id?: number;
  status?: string;
  core_cnt: number;
  node_cnt: number;
  manager_id?: string;
  product_id?: string;
  details: string;
  deposit_use: boolean;
  credit_id: number;
  partner_id: string;
}

export class CreateCreditDto {
  partner_id: string;
  business_id: number;
  deposit: number;
  credit: number;
  note: string;
}

export class UpdateCreditDto {
  credit: number;
}