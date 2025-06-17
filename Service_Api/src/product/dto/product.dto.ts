export class CreateProductDto {
  name: string;
  version: string;
  isoFilePath: string;
  enabled: boolean;
  checksum: string;
}

export class UpdateProductDto {
  name?: string;
  version?: string;
  isoFilePath?: string;
  enabled?: boolean;
  contents?: string;
  checksum: string;
}