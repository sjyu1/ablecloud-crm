export class CreateUserDto {
  name: string;
  version: string;
  isoFilePath: string;
  enabled: boolean;
}

export class UpdateUserDto {
  name?: string;
  version?: string;
  isoFilePath?: string;
  enabled?: boolean;
  contents?: string;
}