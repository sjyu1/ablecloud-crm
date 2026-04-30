import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { request as httpRequest } from "http";
import { request as httpsRequest } from "https";
import { URL } from "url";
import { DatabaseService } from "../database/database.service";
import { getEnv } from "../env";

type UserQuery = {
  searchType?: string;
  keyword?: string;
  type?: string;
  page?: string;
  limit?: string;
};

type AuthContext = {
  userId?: string;
  role?: string;
  preferred_username?: string;
};

type CreateUserInput = {
  role?: string;
  type?: string;
  companyId?: string | number;
  username?: string;
  password?: string;
  passwordConfirm?: string;
  name?: string;
  email?: string;
  telnum?: string;
};

type UpdateUserPasswordInput = {
  password?: string;
  passwordConfirm?: string;
};

type UpdateUserInput = {
  name?: string;
  email?: string;
  telnum?: string;
};

const VALID_USER_TYPES = ["partner", "customer", "vendor"];
const CUSTOMER_TEMPORARY_PASSWORD = "Ablecloud1!";

@Injectable()
export class UserService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getUsers(query: UserQuery, authContext?: AuthContext) {
    const page = Math.max(Number(query.page || 1), 1);
    const limit = Math.min(Math.max(Number(query.limit || 10), 1), 100);
    const offset = (page - 1) * limit;
    const whereClause = await this.buildUserWhereClause(query, authContext);
    const items = await this.fetchUserItems(whereClause, limit, offset);
    const total = await this.fetchUserCount(whereClause);

    return {
      items: items.map((item: any) => ({
        id: item.username || "-",
        email: item.email || "-",
        name: item.name || "-",
        role: this.normalizeUserRole(item.role),
        company: item.company || "-",
        type: String(item.type || "").toUpperCase(),
      })),
      pagination: {
        page,
        limit,
        total,
      },
    };
  }

  async getUserDetail(id: string) {
    const item = await this.fetchUserDetail(id);

    if (!item) {
      throw new NotFoundException("사용자 정보를 찾을 수 없습니다.");
    }

    return {
      id: item.username || "-",
      email: item.email || "-",
      name: item.name || "-",
      role: this.normalizeUserRole(item.role),
      company: item.company || "-",
      type: String(item.type || "").toUpperCase(),
      telnum: item.telnum || "-",
    };
  }

  async getUserFormOptions(authContext?: AuthContext) {
    const [partnerCompanies, customerCompanies] = await Promise.all([
      this.fetchPartnerCompanies(),
      this.fetchCustomerCompanies(authContext),
    ]);
    const typeOptions =
      authContext?.role === "user"
        ? [{ id: "customer", label: "CUSTOMER" }]
        : [
            { id: "partner", label: "PARTNER" },
            { id: "customer", label: "CUSTOMER" },
            { id: "vendor", label: "VENDOR" },
          ];

    return {
      roleOptions:
        authContext?.role === "user"
          ? [{ id: "User", label: "User" }]
          : [
              { id: "User", label: "User" },
              { id: "Admin", label: "Admin" },
            ],
      typeOptions,
      companyOptions: {
        partner: partnerCompanies,
        customer: customerCompanies,
        vendor: [{ id: "ABLECLOUD", label: "ABLECLOUD" }],
      },
    };
  }

  async createUser(input: CreateUserInput, authContext?: AuthContext) {
    const role = String(input.role || "User").trim();
    const type = String(input.type || "").trim().toLowerCase();
    const isCustomerType = type === "customer";
    const companyId = String(input.companyId || "").trim();
    const username = String(input.username || "").trim();
    const password = isCustomerType ? CUSTOMER_TEMPORARY_PASSWORD : String(input.password || "");
    const passwordConfirm = isCustomerType ? CUSTOMER_TEMPORARY_PASSWORD : String(input.passwordConfirm || "");
    const name = String(input.name || "").trim();
    const email = String(input.email || "").trim();
    const telnum = String(input.telnum || "").trim();

    if (!role) {
      throw new BadRequestException("유효한 권한을 선택해주세요.");
    }

    if (authContext?.role === "user" && role !== "User") {
      throw new BadRequestException("유효한 권한을 선택해주세요.");
    }

    if (!VALID_USER_TYPES.includes(type)) {
      throw new BadRequestException("유효한 사용자 구분을 선택해주세요.");
    }

    if (!companyId) {
      throw new BadRequestException("회사를 선택해주세요.");
    }

    if (!username) {
      throw new BadRequestException("아이디를 입력해주세요.");
    }

    if (!password) {
      throw new BadRequestException("비밀번호를 입력해주세요.");
    }

    if (!this.isValidPassword(password)) {
      throw new BadRequestException("비밀번호는 8자 이상이며 대문자/소문자/숫자/특수문자를 모두 포함해야 합니다.");
    }

    if (password !== passwordConfirm) {
      throw new BadRequestException("비밀번호 확인이 일치하지 않습니다.");
    }

    if (!name) {
      throw new BadRequestException("이름을 입력해주세요.");
    }

    if (!email) {
      throw new BadRequestException("이메일을 입력해주세요.");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException("이메일 형식이 올바르지 않습니다.");
    }

    if (!telnum) {
      throw new BadRequestException("전화번호를 입력해주세요.");
    }

    if (type === "partner") {
      await this.ensurePartnerCompanyExists(companyId);
    } else if (type === "customer") {
      await this.ensureCustomerCompanyExists(companyId);
    }

    const accessToken = await this.getAdminAccessToken();
    const env = getEnv();
    const createUrl = `${env.KEYCLOAK_API_URL}/admin/realms/${env.KEYCLOAK_REALM}/users`;
    const payload = {
      username,
      enabled: true,
      email,
      emailVerified: true,
      firstName: name,
      lastName: name,
      credentials: [
        {
          type: "password",
          value: password,
          temporary: false,
        },
      ],
      attributes: {
        type: [type],
        company_id: [companyId],
        telnum: [telnum],
      },
    };

    await this.requestJson(createUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const createdUser = await this.fetchKeycloakUserByUsername(accessToken, username);
    if (!createdUser?.id) {
      throw new BadRequestException("생성된 사용자 정보를 찾지 못했습니다.");
    }

    const roleInfo = await this.fetchKeycloakRole(role);
    if (!roleInfo?.id || !roleInfo?.name) {
      throw new BadRequestException("전달받은 role 정보를 찾지 못했습니다.");
    }

    const roleMappingUrl = `${env.KEYCLOAK_API_URL}/admin/realms/${env.KEYCLOAK_REALM}/users/${createdUser.id}/role-mappings/realm`;
    await this.requestJson(roleMappingUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        {
          id: roleInfo.id,
          name: roleInfo.name,
        },
      ]),
    });

    return {
      message: "사용자가 등록되었습니다.",
    };
  }

  async updateUserPassword(id: string, input: UpdateUserPasswordInput) {
    const username = String(id || "").trim();
    const password = String(input.password || "");
    const passwordConfirm = String(input.passwordConfirm || "");

    if (!username) {
      throw new BadRequestException("사용자 정보를 찾을 수 없습니다.");
    }

    if (!password) {
      throw new BadRequestException("비밀번호를 입력해주세요.");
    }

    if (!this.isValidPassword(password)) {
      throw new BadRequestException("비밀번호는 8자 이상이며 대문자/소문자/숫자/특수문자를 모두 포함해야 합니다.");
    }

    if (password !== passwordConfirm) {
      throw new BadRequestException("비밀번호 확인이 일치하지 않습니다.");
    }

    const accessToken = await this.getAdminAccessToken();
    const env = getEnv();
    const targetUser = await this.fetchKeycloakUserByUsername(accessToken, username);

    if (!targetUser?.id) {
      throw new NotFoundException("사용자 정보를 찾을 수 없습니다.");
    }

    const resetPasswordUrl = `${env.KEYCLOAK_API_URL}/admin/realms/${env.KEYCLOAK_REALM}/users/${targetUser.id}/reset-password`;
    await this.requestJson(resetPasswordUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "password",
        temporary: false,
        value: password,
      }),
    });

    return {
      message: "비밀번호가 변경되었습니다.",
    };
  }

  async deleteUser(id: string) {
    const username = String(id || "").trim();

    if (!username) {
      throw new BadRequestException("사용자 정보를 찾을 수 없습니다.");
    }

    const accessToken = await this.getAdminAccessToken();
    const env = getEnv();
    const targetUser = await this.fetchKeycloakUserByUsername(accessToken, username);

    if (!targetUser?.id) {
      throw new NotFoundException("사용자 정보를 찾을 수 없습니다.");
    }

    const deleteUserUrl = `${env.KEYCLOAK_API_URL}/admin/realms/${env.KEYCLOAK_REALM}/users/${targetUser.id}`;
    await this.requestJson(deleteUserUrl, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return {
      message: "사용자가 삭제되었습니다.",
    };
  }

  async updateUser(id: string, input: UpdateUserInput) {
    const username = String(id || "").trim();
    const name = String(input.name || "").trim();
    const email = String(input.email || "").trim();
    const telnum = String(input.telnum || "").trim();

    if (!username) {
      throw new BadRequestException("사용자 정보를 찾을 수 없습니다.");
    }

    if (!name) {
      throw new BadRequestException("이름을 입력해주세요.");
    }

    if (!email) {
      throw new BadRequestException("이메일을 입력해주세요.");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException("이메일 형식이 올바르지 않습니다.");
    }

    if (!telnum) {
      throw new BadRequestException("전화번호를 입력해주세요.");
    }

    const accessToken = await this.getAdminAccessToken();
    const env = getEnv();
    const targetUser = await this.fetchKeycloakUserByUsername(accessToken, username);

    if (!targetUser?.id) {
      throw new NotFoundException("사용자 정보를 찾을 수 없습니다.");
    }

    const updateUserUrl = `${env.KEYCLOAK_API_URL}/admin/realms/${env.KEYCLOAK_REALM}/users/${targetUser.id}`;
    const nextAttributes = {
      ...(targetUser.attributes || {}),
      telnum: [telnum],
    };

    await this.requestJson(updateUserUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...targetUser,
        firstName: name,
        lastName: name,
        email,
        attributes: nextAttributes,
      }),
    });

    return {
      message: "사용자가 수정되었습니다.",
    };
  }

  async fetchUserCompanyId(userId: string) {
    if (!userId) {
      return "";
    }

    const env = getEnv();
    const escapedUserId = this.databaseService.escapeSqlString(userId);
    const query = `
      SELECT VALUE
      FROM ${env.DB_DATABASE_USER}.USER_ATTRIBUTE
      WHERE USER_ID = '${escapedUserId}'
        AND NAME = 'company_id'
      LIMIT 1
    `;
    const output = await this.databaseService.runMysqlQuery(query);

    return output;
  }

  private async fetchPartnerCompanies() {
    const query = `
      SELECT COALESCE(
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', result.id,
            'label', result.name
          )
        ),
        JSON_ARRAY()
      ) AS payload
      FROM (
        SELECT id, name
        FROM partner
        WHERE removed IS NULL
        ORDER BY name ASC
      ) result
    `;
    const output = await this.databaseService.runMysqlQuery(query);

    return output ? JSON.parse(output) : [];
  }

  private async fetchCustomerCompanies(authContext?: AuthContext) {
    const conditions = ["removed IS NULL"];

    if (authContext?.role === "user") {
      const companyId = Number(await this.fetchUserCompanyId(authContext.userId || ""));

      if (!Number.isInteger(companyId) || companyId < 1) {
        return [];
      }

      conditions.push(`manager_company_id = ${companyId}`);
    }

    const query = `
      SELECT COALESCE(
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', result.id,
            'label', result.name
          )
        ),
        JSON_ARRAY()
      ) AS payload
      FROM (
        SELECT id, name
        FROM customer
        WHERE ${conditions.join(" AND ")}
        ORDER BY name ASC
      ) result
    `;
    const output = await this.databaseService.runMysqlQuery(query);

    return output ? JSON.parse(output) : [];
  }

  private async ensurePartnerCompanyExists(companyId: string) {
    const query = `
      SELECT COUNT(*)
      FROM partner
      WHERE id = ${Number(companyId || 0)}
        AND removed IS NULL
    `;
    const output = await this.databaseService.runMysqlQuery(query);

    if (Number(output || 0) < 1) {
      throw new BadRequestException("유효한 파트너 회사를 선택해주세요.");
    }
  }

  private async ensureCustomerCompanyExists(companyId: string) {
    const query = `
      SELECT COUNT(*)
      FROM customer
      WHERE id = ${Number(companyId || 0)}
        AND removed IS NULL
    `;
    const output = await this.databaseService.runMysqlQuery(query);

    if (Number(output || 0) < 1) {
      throw new BadRequestException("유효한 고객 회사를 선택해주세요.");
    }
  }

  private async fetchUserItems(whereClause: string, limit: number, offset: number) {
    const env = getEnv();
    const query = `
      WITH user_company AS (
        SELECT USER_ID AS user_id, VALUE AS company_id
        FROM ${env.DB_DATABASE_USER}.USER_ATTRIBUTE
        WHERE NAME = 'company_id'
      ),
      user_type AS (
        SELECT USER_ID AS user_id, VALUE AS type
        FROM ${env.DB_DATABASE_USER}.USER_ATTRIBUTE
        WHERE NAME = 'type'
          AND VALUE IN ('partner', 'customer', 'vendor')
      )
      SELECT COALESCE(
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'username', result.username,
            'email', result.email,
            'name', result.name,
            'role', result.role,
            'company', result.company,
            'type', result.type,
            'telnum', result.telnum
          )
        ),
        JSON_ARRAY()
      ) AS payload
      FROM (
        SELECT
          u.USERNAME AS username,
          COALESCE(NULLIF(u.EMAIL, ''), '-') AS email,
          COALESCE(NULLIF(TRIM(COALESCE(u.FIRST_NAME, '')), ''), u.USERNAME, '-') AS name,
          COALESCE(NULLIF(GROUP_CONCAT(DISTINCT kr.NAME ORDER BY kr.NAME SEPARATOR ', '), ''), 'User') AS role,
          ut.type AS type,
          COALESCE(NULLIF(MAX(CASE WHEN ua_tel.NAME = 'telnum' THEN ua_tel.VALUE END), ''), '-') AS telnum,
          CASE
            WHEN ut.type = 'partner' THEN COALESCE(NULLIF(partner.name, ''), '-')
            WHEN ut.type = 'customer' THEN COALESCE(NULLIF(customer.name, ''), '-')
            WHEN ut.type = 'vendor' THEN 'ABLECLOUD'
            ELSE '-'
          END AS company
        FROM ${env.DB_DATABASE_USER}.USER_ENTITY u
        INNER JOIN user_type ut ON u.ID = ut.user_id
        LEFT JOIN user_company uc ON u.ID = uc.user_id
        LEFT JOIN partner ON ut.type = 'partner' AND uc.company_id = CAST(partner.id AS CHAR) AND partner.removed IS NULL
        LEFT JOIN customer ON ut.type = 'customer' AND uc.company_id = CAST(customer.id AS CHAR) AND customer.removed IS NULL
        LEFT JOIN ${env.DB_DATABASE_USER}.USER_ROLE_MAPPING urm ON u.ID = urm.USER_ID
        LEFT JOIN ${env.DB_DATABASE_USER}.KEYCLOAK_ROLE kr ON urm.ROLE_ID = kr.ID
        LEFT JOIN ${env.DB_DATABASE_USER}.USER_ATTRIBUTE ua_tel ON u.ID = ua_tel.USER_ID AND ua_tel.NAME = 'telnum'
        ${whereClause}
        GROUP BY u.ID, u.USERNAME, u.EMAIL, u.FIRST_NAME, ut.type, partner.name, customer.name
        ORDER BY u.CREATED_TIMESTAMP DESC, u.USERNAME ASC
        LIMIT ${limit} OFFSET ${offset}
      ) result
    `;
    const output = await this.databaseService.runMysqlQuery(query);

    return output ? JSON.parse(output) : [];
  }

  private async fetchUserDetail(id: string) {
    const env = getEnv();
    const escapedId = this.databaseService.escapeSqlString(id);
    const query = `
      WITH user_company AS (
        SELECT USER_ID AS user_id, VALUE AS company_id
        FROM ${env.DB_DATABASE_USER}.USER_ATTRIBUTE
        WHERE NAME = 'company_id'
      ),
      user_type AS (
        SELECT USER_ID AS user_id, VALUE AS type
        FROM ${env.DB_DATABASE_USER}.USER_ATTRIBUTE
        WHERE NAME = 'type'
          AND VALUE IN ('partner', 'customer', 'vendor')
      )
      SELECT JSON_OBJECT(
        'username', result.username,
        'email', result.email,
        'name', result.name,
        'role', result.role,
        'type', result.type,
        'company', result.company,
        'telnum', result.telnum
      ) AS payload
      FROM (
        SELECT
          u.USERNAME AS username,
          COALESCE(NULLIF(u.EMAIL, ''), '-') AS email,
          COALESCE(NULLIF(TRIM(COALESCE(u.FIRST_NAME, '')), ''), u.USERNAME, '-') AS name,
          COALESCE(NULLIF(GROUP_CONCAT(DISTINCT kr.NAME ORDER BY kr.NAME SEPARATOR ', '), ''), 'User') AS role,
          ut.type AS type,
          COALESCE(NULLIF(MAX(CASE WHEN ua_tel.NAME = 'telnum' THEN ua_tel.VALUE END), ''), '-') AS telnum,
          CASE
            WHEN ut.type = 'partner' THEN COALESCE(NULLIF(partner.name, ''), '-')
            WHEN ut.type = 'customer' THEN COALESCE(NULLIF(customer.name, ''), '-')
            WHEN ut.type = 'vendor' THEN 'ABLECLOUD'
            ELSE '-'
          END AS company
        FROM ${env.DB_DATABASE_USER}.USER_ENTITY u
        INNER JOIN user_type ut ON u.ID = ut.user_id
        LEFT JOIN user_company uc ON u.ID = uc.user_id
        LEFT JOIN partner ON ut.type = 'partner' AND uc.company_id = CAST(partner.id AS CHAR) AND partner.removed IS NULL
        LEFT JOIN customer ON ut.type = 'customer' AND uc.company_id = CAST(customer.id AS CHAR) AND customer.removed IS NULL
        LEFT JOIN ${env.DB_DATABASE_USER}.USER_ROLE_MAPPING urm ON u.ID = urm.USER_ID
        LEFT JOIN ${env.DB_DATABASE_USER}.KEYCLOAK_ROLE kr ON urm.ROLE_ID = kr.ID
        LEFT JOIN ${env.DB_DATABASE_USER}.USER_ATTRIBUTE ua_tel ON u.ID = ua_tel.USER_ID AND ua_tel.NAME = 'telnum'
        WHERE u.USERNAME = '${escapedId}'
        GROUP BY u.ID, u.USERNAME, u.EMAIL, u.FIRST_NAME, ut.type, partner.name, customer.name
        LIMIT 1
      ) result
    `;
    const output = await this.databaseService.runMysqlQuery(query);

    return output ? JSON.parse(output) : null;
  }

  private async fetchUserCount(whereClause: string) {
    const env = getEnv();
    const query = `
      WITH user_company AS (
        SELECT USER_ID AS user_id, VALUE AS company_id
        FROM ${env.DB_DATABASE_USER}.USER_ATTRIBUTE
        WHERE NAME = 'company_id'
      ),
      user_type AS (
        SELECT USER_ID AS user_id, VALUE AS type
        FROM ${env.DB_DATABASE_USER}.USER_ATTRIBUTE
        WHERE NAME = 'type'
          AND VALUE IN ('partner', 'customer', 'vendor')
      )
      SELECT COUNT(DISTINCT u.ID)
      FROM ${env.DB_DATABASE_USER}.USER_ENTITY u
      INNER JOIN user_type ut ON u.ID = ut.user_id
      LEFT JOIN user_company uc ON u.ID = uc.user_id
      LEFT JOIN partner ON ut.type = 'partner' AND uc.company_id = CAST(partner.id AS CHAR) AND partner.removed IS NULL
      LEFT JOIN customer ON ut.type = 'customer' AND uc.company_id = CAST(customer.id AS CHAR) AND customer.removed IS NULL
      LEFT JOIN ${env.DB_DATABASE_USER}.USER_ROLE_MAPPING urm ON u.ID = urm.USER_ID
      LEFT JOIN ${env.DB_DATABASE_USER}.KEYCLOAK_ROLE kr ON urm.ROLE_ID = kr.ID
      ${whereClause}
    `;
    const output = await this.databaseService.runMysqlQuery(query);

    return Number(output || 0);
  }

  private async buildUserWhereClause(query: UserQuery, authContext?: AuthContext) {
    const conditions = ["1 = 1"];
    const normalizedType = String(query.type || "partner").toLowerCase();

    if (authContext?.role === "user") {
      const companyId = Number(await this.fetchUserCompanyId(authContext.userId || ""));

      if (!Number.isInteger(companyId) || companyId < 1) {
        conditions.push("1 = 0");
      } else if (normalizedType === "customer") {
        conditions.push(`customer.manager_company_id = ${companyId}`);
      } else if (normalizedType === "partner") {
        conditions.push(`uc.company_id = ${companyId}`);
      } else {
        conditions.push("1 = 0");
      }

      conditions.push("ut.type <> 'vendor'");
    }

    if (VALID_USER_TYPES.includes(normalizedType)) {
      conditions.push(`ut.type = '${this.databaseService.escapeSqlString(normalizedType)}'`);
    }

    if (query.keyword) {
      const escapedKeyword = this.databaseService.escapeLike(String(query.keyword));

      if (query.searchType === "email") {
        conditions.push(`u.EMAIL LIKE '%${escapedKeyword}%' ESCAPE '\\\\'`);
      } else if (query.searchType === "name") {
        conditions.push(`u.FIRST_NAME LIKE '%${escapedKeyword}%' ESCAPE '\\\\'`);
      } else if (query.searchType === "company") {
        conditions.push(`(
          partner.name LIKE '%${escapedKeyword}%' ESCAPE '\\\\'
          OR customer.name LIKE '%${escapedKeyword}%' ESCAPE '\\\\'
        )`);
      } else {
        conditions.push(`u.USERNAME LIKE '%${escapedKeyword}%' ESCAPE '\\\\'`);
      }
    }

    return `WHERE ${conditions.join(" AND ")}`;
  }

  private isValidPassword(value: string) {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(value);
  }

  private normalizeUserRole(value?: string) {
    const roles = String(value || "")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);

    if (roles.includes("admin")) {
      return "Admin";
    }

    return "User";
  }

  private async getAdminAccessToken() {
    const env = getEnv();

    if (!env.KEYCLOAK_API_URL || !env.KEYCLOAK_REALM || !env.CLIENT_ID) {
      throw new BadRequestException("Keycloak 설정이 완료되지 않았습니다.");
    }

    const tokenUrl = `${env.KEYCLOAK_API_URL}/realms/${env.KEYCLOAK_REALM}/protocol/openid-connect/token`;
    const data = await this.requestForm(tokenUrl, {
      client_id: env.CLIENT_ID,
      client_secret: env.CLIENT_SECRET,
      grant_type: "client_credentials",
    });

    if (!data.access_token) {
      throw new BadRequestException("Keycloak 관리자 토큰을 가져오지 못했습니다.");
    }

    return String(data.access_token);
  }

  private async fetchKeycloakUserByUsername(accessToken: string, username: string) {
    const env = getEnv();
    const targetUrl = new URL(`${env.KEYCLOAK_API_URL}/admin/realms/${env.KEYCLOAK_REALM}/users`);
    targetUrl.searchParams.set("username", username);
    targetUrl.searchParams.set("exact", "true");
    const output = await this.requestJson(targetUrl.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!Array.isArray(output) || output.length === 0) {
      return null;
    }

    return output[0];
  }

  private async fetchKeycloakRole(roleName: string) {
    const env = getEnv();
    const escapedRoleName = this.databaseService.escapeSqlString(roleName);
    const query = `
      SELECT JSON_OBJECT(
        'id', r.ID,
        'name', r.NAME
      ) AS payload
      FROM ${env.DB_DATABASE_USER}.KEYCLOAK_ROLE r
      WHERE r.NAME = '${escapedRoleName}'
      LIMIT 1
    `;
    const output = await this.databaseService.runMysqlQuery(query, env.DB_DATABASE_USER);

    if (!output) {
      throw new BadRequestException("전달받은 role 정보를 찾지 못했습니다.");
    }

    return JSON.parse(output);
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
            if (!res.statusCode || res.statusCode >= 400) {
              reject(new Error(responseBody || "Request failed"));
              return;
            }

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

  private requestJson(url: string, options: {
    method: string;
    headers?: Record<string, string>;
    body?: string;
  }) {
    return new Promise<any>((resolve, reject) => {
      const target = new URL(url);
      const requestImpl = target.protocol === "https:" ? httpsRequest : httpRequest;
      const body = options.body || "";

      const req = requestImpl(
        {
          protocol: target.protocol,
          hostname: target.hostname,
          port: target.port,
          path: `${target.pathname}${target.search}`,
          method: options.method,
          headers: {
            ...(options.headers || {}),
            ...(body ? { "Content-Length": Buffer.byteLength(body) } : {}),
          },
        },
        (res) => {
          let responseBody = "";

          res.setEncoding("utf8");
          res.on("data", (chunk) => {
            responseBody += chunk;
          });
          res.on("end", () => {
            if (!res.statusCode || res.statusCode >= 400) {
              reject(new BadRequestException(this.parseCreateUserError(responseBody)));
              return;
            }

            if (!responseBody) {
              resolve(null);
              return;
            }

            try {
              resolve(JSON.parse(responseBody));
            } catch (error) {
              resolve(null);
            }
          });
        }
      );

      req.on("error", reject);

      if (body) {
        req.write(body);
      }

      req.end();
    });
  }

  private parseCreateUserError(responseBody: string) {
    const trimmed = String(responseBody || "").trim();

    if (!trimmed) {
      return "사용자 등록 요청에 실패했습니다.";
    }

    if (trimmed.includes("exists")) {
      return "이미 사용 중인 아이디 또는 이메일입니다.";
    }

    return trimmed;
  }
}
