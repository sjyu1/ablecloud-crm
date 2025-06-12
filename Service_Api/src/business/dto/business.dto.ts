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
}

export class CreateBusiness_historyDto {
  business_id: string;
  issue: string;
  solution: string;
  status: string;
  manager: string;
  issued: string;
  started: string;
  ended: string;
  note: string;
}

export class UpdateBusiness_historyDto {
  issue: string;
  solution: string;
  status: string;
  manager: string;
  issued: string;
  started: string;
  ended: string;
  note: string;
}