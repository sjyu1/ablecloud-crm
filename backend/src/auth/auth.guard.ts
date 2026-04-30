import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { request as httpRequest } from "http";
import { request as httpsRequest } from "https";
import { URL } from "url";
import { getEnv } from "../env";
import { IS_PUBLIC_KEY } from "./public.decorator";

type UserInfoResponse = {
  sub: string;
  email_verified: boolean;
  preferred_username: string;
};

type TokenPayload = {
  sub?: string;
  realm_access?: {
    roles?: string[];
  };
  resource_access?: Record<string, { roles?: string[] }>;
};

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    try {
      const request = context.switchToHttp().getRequest();
      const { authorization } = request.headers;

      if (!authorization || authorization.trim() === "") {
        throw new UnauthorizedException("Please provide a valid token");
      }

      const resp = await this.getUserInfo(authorization);
      const tokenInfo = this.parseTokenInfo(authorization);
      request.decodedData = {
        ...resp,
        ...tokenInfo,
      };
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new ForbiddenException("Session expired! Please sign in");
    }
  }

  private async getUserInfo(accessToken: string): Promise<UserInfoResponse> {
    const env = getEnv();

    if (!env.KEYCLOAK_API_URL || !env.KEYCLOAK_REALM) {
      throw new ForbiddenException("Keycloak environment variables are not configured.");
    }

    const userInfoUrl = `${env.KEYCLOAK_API_URL}/realms/${env.KEYCLOAK_REALM}/protocol/openid-connect/userinfo`;
    this.logger.log(`getUserInfo request: ${userInfoUrl}`);
    try {
      return await this.requestJson(userInfoUrl, {
        Authorization: accessToken,
      });
    } catch (error) {
      throw new UnauthorizedException("Failed to fetch user information");
    }
  }

  private requestJson(url: string, headers: Record<string, string>) {
    return new Promise<UserInfoResponse>((resolve, reject) => {
      const target = new URL(url);
      const requestImpl = target.protocol === "https:" ? httpsRequest : httpRequest;

      const req = requestImpl(
        {
          protocol: target.protocol,
          hostname: target.hostname,
          port: target.port,
          path: `${target.pathname}${target.search}`,
          method: "GET",
          headers,
        },
        (res) => {
          let body = "";

          res.setEncoding("utf8");
          res.on("data", (chunk) => {
            body += chunk;
          });
          res.on("end", () => {
            if (!res.statusCode || res.statusCode >= 400) {
              reject(new Error(body || "Request failed"));
              return;
            }

            try {
              resolve(JSON.parse(body));
            } catch (error) {
              reject(error);
            }
          });
        }
      );

      req.on("error", reject);
      req.end();
    });
  }

  private parseTokenInfo(authorization: string) {
    const [, token = ""] = authorization.split(" ");
    const [, payload = ""] = token.split(".");

    if (!payload) {
      return {
        role: "user",
        roles: [],
      };
    }

    try {
      const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
      const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
      const parsedPayload = JSON.parse(
        Buffer.from(padded, "base64").toString("utf8")
      ) as TokenPayload;
      const realmRoles = parsedPayload.realm_access?.roles || [];
      const clientRoles = Object.values(parsedPayload.resource_access || {}).flatMap(
        (resource) => resource?.roles || []
      );
      const roles = [...new Set([...realmRoles, ...clientRoles])];

      return {
        userId: parsedPayload.sub || "",
        role: roles.includes("Admin") ? "admin" : "user",
        roles,
      };
    } catch (error) {
      return {
        role: "user",
        roles: [],
      };
    }
  }
}
