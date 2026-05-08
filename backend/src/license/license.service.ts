import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { createCipheriv, createHash, randomBytes } from "crypto";
import { getEnv } from "../env";
import { DatabaseService } from "../database/database.service";
import { UserService } from "../user/user.service";

type LicenseQuery = {
  searchType?: string;
  keyword?: string;
  trial?: string;
  page?: string;
  limit?: string;
};

type AuthContext = {
  userId?: string;
  role?: string;
  preferred_username?: string;
};

type CreateLicenseInput = {
  businessId?: number | string;
  startDate?: string;
  endDate?: string;
  isPermanent?: boolean;
  isTrial?: boolean;
};

type UpdateLicenseInput = {
  startDate?: string;
  endDate?: string;
  isPermanent?: boolean;
  isTrial?: boolean;
};

@Injectable()
export class LicenseService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly userService: UserService
  ) {}

  async getLicenses(query: LicenseQuery, authContext?: AuthContext) {
    const page = Math.max(Number(query.page || 1), 1);
    const limit = Math.min(Math.max(Number(query.limit || 20), 1), 100);
    const offset = (page - 1) * limit;
    const whereClause = await this.buildWhereClause(query, authContext);
    const items = await this.fetchLicenseItems(whereClause, limit, offset);
    const total = await this.fetchLicenseCount(whereClause);

    return {
      items: items.map((item: any) => ({
        id: item.id,
        key: item.license_key,
        project: item.business_name || "-",
        status: this.mapLicenseStatus(item.status),
        product: [item.product_name, item.product_version ? `(v${item.product_version})` : ""]
          .filter(Boolean)
          .join(" "),
        issuer: item.issued_name || "-",
        startDate: item.issued,
        endDate: item.expired,
        issued: item.issued,
        expired: item.expired,
        trial: Boolean(item.trial),
      })),
      pagination: {
        page,
        limit,
        total,
      },
    };
  }

  async getLicenseDetail(id: string, authContext?: AuthContext) {
    const whereClause = await this.buildDetailWhereClause(id, authContext);
    const item = await this.fetchLicenseDetail(whereClause);

    if (!item) {
      throw new NotFoundException("라이선스 정보를 찾을 수 없습니다.");
    }

    return {
      id: item.id,
      key: item.license_key,
      businessId: item.business_id || "",
      productId: item.product_id || "",
      product: [item.product_name, item.product_version ? `(v${item.product_version})` : ""]
        .filter(Boolean)
        .join(" "),
      status: this.mapLicenseStatus(item.status),
      project: item.business_name || "-",
      startDate: item.issued || "-",
      endDate: item.expired || "-",
      issuer: item.issued_name || "-",
      trial: Boolean(item.trial),
      trialLabel: item.trial ? "o" : "-",
      isPermanent: item.expired === "9999-12-31",
      oem: item.oem ? item.oem : "ABLESTACK",
      issuerCompany: item.company_name || item.customer_name || "-",
      createdAt: item.created || "-",
      approver: item.approved_name || item.approve_user || "-",
      approvedAt: item.approved || "-",
    };
  }

  async downloadLicenseFile(id: string, authContext?: AuthContext) {
    const license = await this.getLicenseDetail(id, authContext);

    if (license.status !== "활성") {
      throw new BadRequestException("활성화된 라이선스만 다운로드할 수 있습니다.");
    }

    const payload = JSON.stringify({
      id: license.id,
      key: license.key,
      product: license.product,
      status: license.status,
      project: license.project,
      startDate: license.startDate,
      endDate: license.endDate,
      issuer: license.issuer,
      trial: license.trial,
      oem: license.oem,
      issuerCompany: license.issuerCompany,
      createdAt: license.createdAt,
      approver: license.approver,
      approvedAt: license.approvedAt,
    });

    console.log("[license-download] plain payload:", payload);

    return {
      filename: this.generateLicenseKey(),
      content: this.encryptLicensePayload(payload),
    };
  }

  async createLicense(input: CreateLicenseInput, authContext?: AuthContext) {
    const businessId = Number(input.businessId);

    if (!Number.isInteger(businessId) || businessId < 1) {
      throw new BadRequestException("유효한 사업을 선택해주세요.");
    }

    if (!input.startDate) {
      throw new BadRequestException("시작일을 입력해주세요.");
    }

    const business = await this.fetchBusinessForLicenseCreation(businessId, authContext);
console.log("[createLicense] fetched business:", business);
    if (!business) {
      throw new NotFoundException("라이선스를 생성할 수 있는 사업을 찾지 못했습니다.");
    }

    const startDate = this.normalizeDate(input.startDate);
    const endDate = this.resolveEndDate({
      endDate: input.endDate,
      isPermanent: Boolean(input.isPermanent),
      isTrial: Boolean(input.isTrial),
      startDate,
    });
    const companyId = Number(business.customer_id);
    const licenseKey = this.generateLicenseKey();
    const escapedLicenseKey = this.databaseService.escapeSqlString(licenseKey);
    const escapedStartDate = this.databaseService.escapeSqlString(startDate);
    const escapedEndDate = this.databaseService.escapeSqlString(endDate);
    const escapedIssuedId = this.databaseService.escapeSqlString(authContext?.userId || "");
    const status = authContext?.role === "admin" ? "active" : "inactive";
    const escapedStatus = this.databaseService.escapeSqlString(status);
    const issuedIdValue = authContext?.userId ? `'${escapedIssuedId}'` : "NULL";
    const trialValue = input.isTrial ? 1 : 0;

    const insertQuery = `
      INSERT INTO license (
        license_key,
        status,
        company_id,
        issued_id,
        issued,
        expired,
        trial,
        oem,
        business_id
      ) VALUES (
        '${escapedLicenseKey}',
        '${escapedStatus}',
        ${Number.isFinite(companyId) ? companyId : 0},
        ${issuedIdValue},
        '${escapedStartDate}',
        '${escapedEndDate}',
        ${trialValue},
        'ABLESTACK',
        ${businessId}
      )
    `;
    await this.databaseService.runMysqlQuery(insertQuery);

    const createdLicenseId = await this.fetchCreatedLicenseId(licenseKey);

    const updateBusinessQuery = `
      UPDATE business
      SET license_id = '${createdLicenseId}'
      WHERE id = ${businessId}
    `;
    await this.databaseService.runMysqlQuery(updateBusinessQuery);

    return {
      id: createdLicenseId,
      key: licenseKey,
      message: "라이선스가 생성되었습니다.",
    };
  }

  async updateLicense(id: string, input: UpdateLicenseInput, authContext?: AuthContext) {
    const whereClause = await this.buildDetailWhereClause(id, authContext);
    const license = await this.fetchLicenseDetail(whereClause);

    if (!license) {
      throw new NotFoundException("수정할 라이선스 정보를 찾을 수 없습니다.");
    }

    if (!input.startDate) {
      throw new BadRequestException("시작일을 입력해주세요.");
    }

    const startDate = this.normalizeDate(input.startDate);
    const endDate = this.resolveEndDate({
      endDate: input.endDate,
      isPermanent: Boolean(input.isPermanent),
      isTrial: Boolean(input.isTrial),
      startDate,
    });

    const escapedStartDate = this.databaseService.escapeSqlString(startDate);
    const escapedEndDate = this.databaseService.escapeSqlString(endDate);
    const parsedId = Number(id);
    const trialValue = input.isTrial ? 1 : 0;
    const updateQuery = `
      UPDATE license
      SET issued = '${escapedStartDate}',
          expired = '${escapedEndDate}',
          trial = ${trialValue},
          updated = CURRENT_TIMESTAMP(6)
      WHERE id = ${parsedId}
    `;
    await this.databaseService.runMysqlQuery(updateQuery);

    return {
      id: parsedId,
      message: "라이선스가 수정되었습니다.",
    };
  }

  async approveLicense(id: string, authContext?: AuthContext) {
    if (authContext?.role !== "admin") {
      throw new BadRequestException("승인 권한이 없습니다.");
    }

    const whereClause = await this.buildDetailWhereClause(id, authContext);
    const license = await this.fetchLicenseDetail(whereClause);

    if (!license) {
      throw new NotFoundException("승인할 라이선스 정보를 찾을 수 없습니다.");
    }

    if (license.status === "active") {
      throw new BadRequestException("이미 승인된 라이선스입니다.");
    }

    const parsedId = Number(id);
    const escapedUsername = this.databaseService.escapeSqlString(
      authContext?.preferred_username || ""
    );
    const approveUserValue = escapedUsername ? `'${escapedUsername}'` : "NULL";
    const approveQuery = `
      UPDATE license
      SET approve_user = ${approveUserValue},
          status = 'active',
          approved = CURRENT_TIMESTAMP(6),
          updated = CURRENT_TIMESTAMP(6)
      WHERE id = ${parsedId}
    `;
    await this.databaseService.runMysqlQuery(approveQuery);

    return {
      id: parsedId,
      message: "라이선스가 승인되었습니다.",
    };
  }

  async deleteLicense(id: string, authContext?: AuthContext) {
    const whereClause = await this.buildDetailWhereClause(id, authContext);
    const license = await this.fetchLicenseDetail(whereClause);

    if (!license) {
      throw new NotFoundException("삭제할 라이선스 정보를 찾을 수 없습니다.");
    }

    const parsedId = Number(id);
    const deleteQuery = `
      UPDATE license
      SET removed = CURRENT_TIMESTAMP(6),
          updated = CURRENT_TIMESTAMP(6)
      WHERE id = ${parsedId}
    `;
    await this.databaseService.runMysqlQuery(deleteQuery);

    const clearBusinessQuery = `
      UPDATE business
      SET license_id = NULL
      WHERE id = ${Number(license.business_id)}
    `;
    await this.databaseService.runMysqlQuery(clearBusinessQuery);

    return {
      id: parsedId,
      message: "라이선스가 삭제되었습니다.",
    };
  }

  private async fetchLicenseItems(whereClause: string, limit: number, offset: number) {
    const env = getEnv();
    const query = `
      WITH user_company AS (
        SELECT USER_ID AS user_id, VALUE AS company_id
        FROM ${env.DB_DATABASE_USER}.USER_ATTRIBUTE
        WHERE NAME = 'company_id'
      )
      SELECT COALESCE(
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', result.id,
            'license_key', result.license_key,
            'issued', result.issued,
            'expired', result.expired,
            'status', result.status,
            'company_id', result.company_id,
            'approve_user', result.approve_user,
            'approved', result.approved,
            'business_id', result.business_id,
            'issued_id', result.issued_id,
            'trial', result.trial,
            'created', result.created,
            'business_name', result.business_name,
            'product_name', result.product_name,
            'product_version', result.product_version,
            'issued_name', result.issued_name
          )
        ),
        JSON_ARRAY()
      ) AS payload
      FROM (
        SELECT
          l.id AS id,
          l.license_key AS license_key,
          l.issued AS issued,
          l.expired AS expired,
          l.status AS status,
          l.company_id AS company_id,
          l.approve_user AS approve_user,
          l.approved AS approved,
          l.business_id AS business_id,
          l.issued_id AS issued_id,
          l.trial AS trial,
          l.created AS created,
          b.name AS business_name,
          p.name AS product_name,
          p.version AS product_version,
          u.USERNAME AS issued_name
        FROM license l
        LEFT JOIN business b ON l.business_id = b.id
        LEFT JOIN product p ON b.product_id = p.id
        LEFT JOIN ${env.DB_DATABASE_USER}.USER_ENTITY u ON l.issued_id = u.ID
        LEFT JOIN user_company buc ON b.manager_id = buc.user_id
        ${whereClause}
        ORDER BY l.created DESC
        LIMIT ${limit} OFFSET ${offset}
      ) result
    `;
    const output = await this.databaseService.runMysqlQuery(query);

    return output ? JSON.parse(output) : [];
  }

  private async fetchLicenseCount(whereClause: string) {
    const env = getEnv();
    const query = `
      WITH user_company AS (
        SELECT USER_ID AS user_id, VALUE AS company_id
        FROM ${env.DB_DATABASE_USER}.USER_ATTRIBUTE
        WHERE NAME = 'company_id'
      )
      SELECT COUNT(*) AS total
      FROM license l
      LEFT JOIN business b ON l.business_id = b.id
      LEFT JOIN product p ON b.product_id = p.id
      LEFT JOIN ${env.DB_DATABASE_USER}.USER_ENTITY u ON l.issued_id = u.ID
      LEFT JOIN user_company buc ON b.manager_id = buc.user_id
      ${whereClause}
    `;
    const output = await this.databaseService.runMysqlQuery(query);

    return Number(output || 0);
  }

  private async fetchLicenseDetail(whereClause: string) {
    const env = getEnv();
    const query = `
      WITH user_company AS (
        SELECT USER_ID AS user_id, VALUE AS company_id
        FROM ${env.DB_DATABASE_USER}.USER_ATTRIBUTE
        WHERE NAME = 'company_id'
      )
      SELECT JSON_OBJECT(
        'id', l.id,
        'license_key', l.license_key,
        'issued', l.issued,
        'expired', l.expired,
        'status', l.status,
        'company_id', l.company_id,
        'approve_user', l.approve_user,
        'approved', l.approved,
        'business_id', l.business_id,
        'issued_id', l.issued_id,
        'trial', l.trial,
        'created', l.created,
        'oem', l.oem,
        'business_name', b.name,
        'product_id', b.product_id,
        'product_name', p.name,
        'product_version', p.version,
        'issued_name', iu.USERNAME,
        'approved_name', au.USERNAME,
        'company_name', partner.name,
        'customer_name', c.name
      ) AS payload
      FROM license l
      LEFT JOIN business b ON l.business_id = b.id
      LEFT JOIN customer c ON b.customer_id = c.id
      LEFT JOIN product p ON b.product_id = p.id
      LEFT JOIN ${env.DB_DATABASE_USER}.USER_ENTITY iu ON l.issued_id = iu.ID
      LEFT JOIN ${env.DB_DATABASE_USER}.USER_ENTITY au
        ON l.approve_user = au.ID OR l.approve_user = au.USERNAME
      LEFT JOIN partner ON l.company_id = partner.id
      LEFT JOIN user_company buc ON b.manager_id = buc.user_id
      ${whereClause}
      LIMIT 1
    `;
    const output = await this.databaseService.runMysqlQuery(query);

    return output ? JSON.parse(output) : null;
  }

  private async fetchBusinessForLicenseCreation(businessId: number, authContext?: AuthContext) {
    const conditions = ["b.removed IS NULL", `b.id = ${businessId}`, "b.license_id IS NULL"];

    // if (authContext?.role === "user") {
    //   const companyId = await this.userService.fetchUserCompanyId(authContext.userId || "");

    //   if (!companyId) {
    //     conditions.push("1 = 0");
    //   } else {
    //     conditions.push(`b.customer_id = ${companyId}`);
    //   }
    // }

    const query = `
      SELECT JSON_OBJECT(
        'id', b.id,
        'customer_id', b.customer_id
      ) AS payload
      FROM business b
      WHERE ${conditions.join(" AND ")}
      LIMIT 1
    `;
    const output = await this.databaseService.runMysqlQuery(query);

    return output ? JSON.parse(output) : null;
  }

  private async fetchCreatedLicenseId(licenseKey: string) {
    const escapedLicenseKey = this.databaseService.escapeSqlString(licenseKey);
    const query = `
      SELECT id
      FROM license
      WHERE license_key = '${escapedLicenseKey}'
      LIMIT 1
    `;
    const output = await this.databaseService.runMysqlQuery(query);

    return Number(output || 0);
  }

  private async buildWhereClause(query: LicenseQuery, authContext?: AuthContext) {
    const conditions = ["l.removed IS NULL"];
    const searchColumnMap: Record<string, string> = {
      business_name: "b.name",
      license_key: "l.license_key",
    };

    if (authContext?.role === "user") {
      const companyId = this.normalizeCompanyId(
        await this.userService.fetchUserCompanyId(authContext.userId || "")
      );

      if (!companyId) {
        conditions.push("1 = 0");
      } else {
        conditions.push(`buc.company_id = '${companyId}'`);
      }
    }

    if (query.trial === "trial") {
      conditions.push("l.trial = 1");
    } else {
      conditions.push("(l.trial IS NULL OR l.trial = 0)");
    }

    if (query.searchType === "status" && query.keyword) {
      conditions.push(`l.status = '${this.databaseService.escapeLike(query.keyword)}'`);
    } else if (query.keyword && query.searchType && searchColumnMap[query.searchType]) {
      const escapedKeyword = this.databaseService.escapeLike(query.keyword);
      conditions.push(
        `${searchColumnMap[query.searchType]} LIKE '%${escapedKeyword}%' ESCAPE '\\\\'`
      );
    }

    return `WHERE ${conditions.join(" AND ")}`;
  }

  private async buildDetailWhereClause(id: string, authContext?: AuthContext) {
    const parsedId = Number(id);
    const conditions = ["l.removed IS NULL"];

    if (!Number.isInteger(parsedId) || parsedId < 1) {
      conditions.push("1 = 0");
    } else {
      conditions.push(`l.id = ${parsedId}`);
    }

    if (authContext?.role === "user") {
      const companyId = this.normalizeCompanyId(
        await this.userService.fetchUserCompanyId(authContext.userId || "")
      );

      if (!companyId) {
        conditions.push("1 = 0");
      } else {
        conditions.push(`buc.company_id = '${companyId}'`);
      }
    }

    return `WHERE ${conditions.join(" AND ")}`;
  }

  private normalizeDate(value: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new BadRequestException("날짜 형식이 올바르지 않습니다.");
    }

    return value;
  }

  private normalizeCompanyId(value: string) {
    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed < 1) {
      return 0;
    }

    return parsed;
  }

  private resolveEndDate({
    endDate,
    isPermanent,
    isTrial,
    startDate,
  }: {
    endDate?: string;
    isPermanent: boolean;
    isTrial: boolean;
    startDate: string;
  }) {
    const start = new Date(`${startDate}T00:00:00Z`);

    if (isPermanent) {
      return "9999-12-31";
    }

    if (isTrial) {
      const date = new Date(`${startDate}T00:00:00Z`);
      date.setUTCMonth(date.getUTCMonth() + 1);
      return date.toISOString().slice(0, 10);
    }

    if (!endDate) {
      throw new BadRequestException("만료일을 입력해주세요.");
    }

    const normalizedEndDate = this.normalizeDate(endDate);
    const end = new Date(`${normalizedEndDate}T00:00:00Z`);

    if (end < start) {
      throw new BadRequestException("만료일은 시작일보다 빠를 수 없습니다.");
    }

    return normalizedEndDate;
  }

  private generateLicenseKey() {
    const bytes = randomBytes(16);

    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = bytes.toString("hex");

    return [
      hex.slice(0, 8),
      hex.slice(8, 12),
      hex.slice(12, 16),
      hex.slice(16, 20),
      hex.slice(20, 32),
    ].join("-");
  }

  private encryptLicensePayload(payload: string) {
    const env = getEnv();
    const iv = randomBytes(12);
    const key = createHash("sha256").update(env.LICENSE_FILE_SECRET).digest();
    const cipher = createCipheriv("aes-256-gcm", key, iv);
    const encrypted = Buffer.concat([
      cipher.update(payload, "utf8"),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
  }

  private mapLicenseStatus(status: string) {
    if (status === "active") {
      return "활성";
    }

    if (status === "expired") {
      return "만료";
    }

    return "비활성";
  }
}
