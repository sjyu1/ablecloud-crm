export class CreateSupportDto {
  customer_id: string;
  business_id: string;
  issued: string;
  type: 'poc' | 'consult' | 'technical' | 'other' | 'incident';
  issue: string;
  solution: string;
  actioned: string;
  action_type: 'mail' | 'remote' | 'phone' | 'site';
  manager: string;
  status: 'processing' | 'complete';
  note: string;
}

export class UpdateSupportDto {
  customer_id: string;
  business_id: string;
  issued: string;
  type: 'poc' | 'consult' | 'technical' | 'other' | 'incident';
  issue: string;
  solution: string;
  actioned: string;
  action_type: 'mail' | 'remote' | 'phone' | 'site';
  manager: string;
  status: 'processing' | 'complete';
  note: string;
}