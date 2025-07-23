export class CreateCreditDto {
  deposit: number;
  credit: number;
  partner_id: string;
  business_id: number;
  note: string;
}

export class UpdateCreditDto {
  deposit: number;
  credit: number;
  partner_id: string;
  note: string;
}