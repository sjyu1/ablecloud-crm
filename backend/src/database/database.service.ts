import { Injectable } from "@nestjs/common";
import { execFile } from "child_process";
import { promisify } from "util";
import { getEnv } from "../env";

const execFileAsync = promisify(execFile);

@Injectable()
export class DatabaseService {
  async runMysqlQuery(query: string, database?: string) {
    const env = getEnv();
    const args = [
      "--host",
      env.DB_HOST,
      "--port",
      env.DB_PORT,
      "--user",
      env.DB_USER,
      "--database",
      database || env.DB_DATABASE,
      "--batch",
      "--raw",
      "--skip-column-names",
      "--execute",
      query,
    ];
    const { stdout } = await execFileAsync("mysql", args, {
      env: {
        ...process.env,
        MYSQL_PWD: env.DB_PASSWORD,
      },
      maxBuffer: 10 * 1024 * 1024,
    });

    return stdout.trim();
  }

  escapeLike(value: string) {
    return value
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "\\'")
      .replace(/%/g, "\\%")
      .replace(/_/g, "\\_");
  }

  escapeSqlString(value: string) {
    return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  }
}
