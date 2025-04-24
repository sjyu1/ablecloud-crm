export class CreateProductDto {
  name: string;
  version: string;
  isoFilePath: string;
  enabled: boolean;
  cube_version: string;
  mold_version: string;
  glue_version: string;
  iso_builddate: string;
  cube_builddate: string;
  glue_builddate: string;
  mold_builddate: string;
  add_function: string;
  patch_function: string;
  issue_function: string;
}

export class UpdateProductDto {
  name?: string;
  version?: string;
  isoFilePath?: string;
  enabled?: boolean;
  cube_version?: string;
  mold_version?: string;
  glue_version?: string;
  iso_builddate?: string;
  cube_builddate?: string;
  glue_builddate?: string;
  mold_builddate?: string;
  add_function?: string;
  patch_function?: string;
  issue_function?: string;
} 