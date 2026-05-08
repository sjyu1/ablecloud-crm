import { Injectable, UnauthorizedException } from "@nestjs/common";
import { request as httpRequest } from "http";
import { request as httpsRequest } from "https";
import { URL } from "url";
import { getEnv } from "../env";

@Injectable()
export class AuthService {
  async login(username?: string, password?: string) {
    if (!username || !password) {
      throw new UnauthorizedException("아이디와 비밀번호를 입력해주세요.");
    }

    const env = getEnv();

    if (!env.KEYCLOAK_API_URL || !env.KEYCLOAK_REALM || !env.CLIENT_ID) {
      throw new UnauthorizedException("로그인 설정이 완료되지 않았습니다.");
    }

    const tokenUrl = `${env.KEYCLOAK_API_URL}/realms/${env.KEYCLOAK_REALM}/protocol/openid-connect/token`;

    try {
      const data = await this.requestForm(tokenUrl, {
        client_id: env.CLIENT_ID,
        client_secret: env.CLIENT_SECRET,
        grant_type: env.GRANT_TYPE,
        scope: env.SCOPE,
        username,
        password,
      });

      if (data.error || !data.access_token) {
        throw new Error(data.error || "Login failed");
      }

      console.log("Login successful for user:", username);

      return {
        token: data.access_token,
        user: {
          username,
        },
      };
    } catch (error) {
      throw new UnauthorizedException("아이디 또는 비밀번호가 올바르지 않습니다.");
    }
  }

  private requestForm(url: string, formData: Record<string, string>) {
    return new Promise<Record<string, any>>((resolve, reject) => {
      const target = new URL(url);
      const body = new URLSearchParams(formData).toString();
      const requestImpl = target.protocol === "https:" ? httpsRequest : httpRequest;

      const req = requestImpl(
        {
          protocol: target.protocol,
          hostname: target.hostname,
          port: target.port,
          path: `${target.pathname}${target.search}`,
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Content-Length": Buffer.byteLength(body),
          },
        },
        (res) => {
          let responseBody = "";

          res.setEncoding("utf8");
          res.on("data", (chunk) => {
            responseBody += chunk;
          });
          res.on("end", () => {
            try {
              resolve(JSON.parse(responseBody));
            } catch (error) {
              reject(error);
            }
          });
        }
      );

      req.on("error", reject);
      req.write(body);
      req.end();
    });
  }
}
