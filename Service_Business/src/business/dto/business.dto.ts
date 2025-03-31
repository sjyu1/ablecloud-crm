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
  product_type?: string;
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
  product_type?: string;
}