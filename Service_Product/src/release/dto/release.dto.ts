export class CreateReleaseDto {
  version: string;
  contents: string;
  enabled: boolean;
}

export class UpdateReleaseDto {
  version?: string;
  contents?: string;
  enabled?: boolean;
} 