export class CreateProductDto {
  name: string;
  version: string;
  isoFilePath: string;
  // rpmFilePath: string;
  history: string;
  enabled: boolean;
}

export class UpdateProductDto {
  name?: string;
  version?: string;
  isoFilePath?: string;
  // rpmFilePath?: string;
  history?: string;
  enabled?: boolean;
} 