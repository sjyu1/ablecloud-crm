export class CreateProductDto {
  name: string;
  category_id: number;
  version: string;
  isoFilePath: string;
  enabled: boolean;
  checksum: string;
}

export class UpdateProductDto {
  name?: string;
  category_id?: number;
  version?: string;
  isoFilePath?: string;
  enabled?: boolean;
  contents?: string;
  checksum: string;
}