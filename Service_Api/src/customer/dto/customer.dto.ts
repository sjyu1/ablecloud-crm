export class CreateCustomerDto {
  name: string;
  telnum: string;
  manager_id: string;
  manager_company_id: string;
}

export class UpdateCustomerDto {
  name?: string;
  telnum?: string;
  manager_id?: string;
}