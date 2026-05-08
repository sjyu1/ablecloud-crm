import { existsSync, readFileSync } from "fs";
import { join } from "path";

export type AppEnv = {
  DB_HOST: string;
  DB_PORT: string;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_DATABASE: string;
  DB_DATABASE_USER: string;
  KEYCLOAK_API_URL: string;
  KEYCLOAK_REALM: string;
  CLIENT_ID: string;
  CLIENT_SECRET: string;
  GRANT_TYPE: string;
  SCOPE: string;
  LICENSE_FILE_SECRET: string;
};

let cachedEnv: AppEnv | null = null;

function parseEnvFile() {
  const envPath = join(process.cwd(), ".env");

  if (!existsSync(envPath)) {
    return {};
  }

  const content = readFileSync(envPath, "utf8");

  return content.split(/\r?\n/).reduce<Record<string, string>>((acc, line) => {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      return acc;
    }

    const delimiterIndex = trimmed.indexOf("=");

    if (delimiterIndex === -1) {
      return acc;
    }

    const key = trimmed.slice(0, delimiterIndex).trim();
    const rawValue = trimmed.slice(delimiterIndex + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, "");

    acc[key] = value;
    return acc;
  }, {});
}

export function getEnv() {
  if (cachedEnv) {
    return cachedEnv;
  }

  const fileEnv = parseEnvFile();

  cachedEnv = {
    DB_HOST: process.env.DB_HOST || fileEnv.DB_HOST || "localhost",
    DB_PORT: process.env.DB_PORT || fileEnv.DB_PORT || "3306",
    DB_USER: process.env.DB_USER || fileEnv.DB_USER || "user",
    DB_PASSWORD: process.env.DB_PASSWORD || fileEnv.DB_PASSWORD || "",
    DB_DATABASE: process.env.DB_DATABASE || fileEnv.DB_DATABASE || "licenses",
    DB_DATABASE_USER:
      process.env.DB_DATABASE_USER || fileEnv.DB_DATABASE_USER || "keycloak",
    KEYCLOAK_API_URL:
      process.env.KEYCLOAK_API_URL || fileEnv.KEYCLOAK_API_URL || "",
    KEYCLOAK_REALM: process.env.KEYCLOAK_REALM || fileEnv.KEYCLOAK_REALM || "",
    CLIENT_ID: process.env.CLIENT_ID || fileEnv.CLIENT_ID || "",
    CLIENT_SECRET: process.env.CLIENT_SECRET || fileEnv.CLIENT_SECRET || "",
    GRANT_TYPE: process.env.GRANT_TYPE || fileEnv.GRANT_TYPE || "password",
    SCOPE: process.env.SCOPE || fileEnv.SCOPE || "openid profile email",
    LICENSE_FILE_SECRET:
      process.env.LICENSE_FILE_SECRET ||
      fileEnv.LICENSE_FILE_SECRET ||
      "ablestack-license-file-secret",
  };

  return cachedEnv;
}
