import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { getEnv } from "../env";
import { DatabaseService } from "../database/database.service";
import { UserService } from "../user/user.service";

type CreditQuery = {
  searchType?: string;
  keyword?: string;
  kind?: string;
  page?: string;
  limit?: string;
};

type CreditInput = {
  partnerId?: number | string;
  businessId?: number | string;
  deposit?: number | string;
  credit?: number | string;
  note?: string;
};

type AuthContext = {
  userId?: string;
  role?: string;
};

@Injectable()
export class CreditService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly userService: UserService
  ) {}

  async getCredits(query: CreditQuery, authContext?: AuthContext) {
    const page = Math.max(Number(query.page || 1), 1);
    const limit = Math.min(Math.max(Number(query.limit || 10), 1), 100);
    const offset = (page - 1) * limit;
    const whereClause = await this.buildWhereClause(query, authContext);
    const items = await this.fetchCreditItems(whereClause, limit, offset);
    const total = await this.fetchCreditCount(whereClause);

    return {
      items: items.map((item: any) => ({
        id: item.id,
        partner: item.partner_name || "-",
        business: item.business_name || "-",
        customer: item.customer_name || "-",
        product: [item.product_name, item.product_version ? `(v${item.product_version})` : ""]
          .filter(Boolean)
          .join(" ") || "-",
        deposit: item.deposit === null || item.deposit === undefined ? null : Number(item.deposit),
        credit: item.credit === null || item.credit === undefined ? null : Number(item.credit),
        note: item.note || "-",
        createdAt: item.created || "-",
      })),
      pagination: {
        page,
        limit,
        total,
      },
    };
  }

  async getCreditFormOptions(authContext?: AuthContext) {
    const [partnerOptions, businessOptions] = await Promise.all([
      this.fetchPartnerOptions(authContext),
      this.fetchBusinessOptions(authContext),
    ]);

    return {
      partnerOptions,
      businessOptions,
    };
  }

  async getCreditDetail(id: string, authContext?: AuthContext) {
    const whereClause = await this.buildDetailWhereClause(id, authContext);
    const item = await this.fetchCreditDetail(whereClause);

    if (!item) {
      throw new NotFoundException("크레딧 정보를 찾을 수 없습니다.");
    }

    const [partnerOptions, businessOptions] = await Promise.all([
      this.fetchPartnerOptions(authContext),
      this.fetchBusinessOptions(authContext),
    ]);

    return {
      id: item.id,
      partnerId: item.partner_id || "",
      partner: item.partner_name || "-",
      businessId: item.business_id || "",
      business: item.business_name || "-",
      customer: item.customer_name || "-",
      product: [item.product_name, item.product_version ? `(v${item.product_version})` : ""]
        .filter(Boolean)
        .join(" ") || "-",
      deposit: item.deposit === null || item.deposit === undefined ? null : Number(item.deposit),
      credit: item.credit === null || item.credit === undefined ? null : Number(item.credit),
      note: item.note || "",
      createdAt: item.created || "-",
      updatedAt: item.updated || "-",
      partnerOptions,
      businessOptions,
    };
  }

  async createCredit(input: CreditInput, authContext?: AuthContext) {
    const normalized = this.normalizeInput(input);
    await this.ensurePartnerAccess(normalized.partnerId, authContext);

    if (normalized.businessId) {
      await this.ensureBusinessExists(normalized.businessId, authContext);
    }

    const insertQuery = `
      INSERT INTO credit (
        partner_id,
        business_id,
        deposit,
        credit,
        note
      ) VALUES (
        ${normalized.partnerId},
        ${normalized.businessId || "NULL"},
        ${this.sqlNullableNumber(normalized.deposit)},
        ${this.sqlNullableNumber(normalized.credit)},
        ${this.sqlNullableString(normalized.note)}
      );
      SELECT LAST_INSERT_ID();
    `;
    const createdId = Number(await this.databaseService.runMysqlQuery(insertQuery));

    return {
      id: createdId,
      message: "크레딧이 등록되었습니다.",
    };
  }

  async updateCredit(id: string, input: CreditInput, authContext?: AuthContext) {
    const whereClause = await this.buildDetailWhereClause(id, authContext);
    const creditItem = await this.fetchCreditDetail(whereClause);

    if (!creditItem) {
      throw new NotFoundException("수정할 크레딧 정보를 찾을 수 없습니다.");
    }

    const parsedId = Number(id);

    if (!Number.isInteger(parsedId) || parsedId < 1) {
      throw new BadRequestException("유효한 크레딧 정보가 아닙니다.");
    }

    const normalized = this.normalizeInput(input);
    await this.ensurePartnerAccess(normalized.partnerId, authContext);

    if (normalized.businessId) {
      await this.ensureBusinessExists(normalized.businessId, authContext);
    }

    const updateQuery = `
      UPDATE credit
      SET partner_id = ${normalized.partnerId},
          business_id = ${normalized.businessId || "NULL"},
          deposit = ${this.sqlNullableNumber(normalized.deposit)},
          credit = ${this.sqlNullableNumber(normalized.credit)},
          note = ${this.sqlNullableString(normalized.note)},
          updated = CURRENT_TIMESTAMP(6)
      WHERE id = ${parsedId}
    `;
    await this.databaseService.runMysqlQuery(updateQuery);

    return {
      id: parsedId,
      message: "크레딧이 수정되었습니다.",
    };
  }

  async deleteCredit(id: string, authContext?: AuthContext) {
    const whereClause = await this.buildDetailWhereClause(id, authContext);
    const creditItem = await this.fetchCreditDetail(whereClause);

    if (!creditItem) {
      throw new NotFoundException("삭제할 크레딧 정보를 찾을 수 없습니다.");
    }

    const parsedId = Number(id);
    const deleteQuery = `
      UPDATE credit
      SET removed = CURRENT_TIMESTAMP(6),
          updated = CURRENT_TIMESTAMP(6)
      WHERE id = ${parsedId}
    `;
    await this.databaseService.runMysqlQuery(deleteQuery);

    return {
      id: parsedId,
      message: "크레딧이 삭제되었습니다.",
    };
  }

  private async fetchCreditItems(whereClause: string, limit: number, offset: number) {
    const query = `
      SELECT COALESCE(
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', result.id,
            'partner_id', result.partner_id,
            'business_id', result.business_id,
            'deposit', result.deposit,
            'credit', result.credit,
            'note', result.note,
            'created', result.created,
            'updated', result.updated,
            'partner_name', result.partner_name,
            'business_name', result.business_name,
            'customer_name', result.customer_name,
            'product_name', result.product_name,
            'product_version', result.product_version
          )
        ),
        JSON_ARRAY()
      ) AS payload
      FROM (
        SELECT
          cr.id,
          cr.partner_id,
          cr.business_id,
          cr.deposit,
          cr.credit,
          cr.note,
          cr.created,
          cr.updated,
          partner.name AS partner_name,
          b.name AS business_name,
          c.name AS customer_name,
          p.name AS product_name,
          p.version AS product_version
        FROM credit cr
        LEFT JOIN partner ON cr.partner_id = partner.id AND partner.removed IS NULL
        LEFT JOIN business b ON cr.business_id = b.id AND b.removed IS NULL
        LEFT JOIN customer c ON b.customer_id = c.id AND c.removed IS NULL
        LEFT JOIN product p ON b.product_id = p.id AND p.removed IS NULL
        ${whereClause}
        ORDER BY cr.created DESC
        LIMIT ${limit} OFFSET ${offset}
      ) result
    `;
    const output = await this.databaseService.runMysqlQuery(query);

    return output ? JSON.parse(output) : [];
  }

  private async fetchCreditCount(whereClause: string) {
    const query = `
      SELECT COUNT(*)
      FROM credit cr
      LEFT JOIN partner ON cr.partner_id = partner.id AND partner.removed IS NULL
      LEFT JOIN business b ON cr.business_id = b.id AND b.removed IS NULL
      LEFT JOIN customer c ON b.customer_id = c.id AND c.removed IS NULL
      LEFT JOIN product p ON b.product_id = p.id AND p.removed IS NULL
      ${whereClause}
    `;
    const output = await this.databaseService.runMysqlQuery(query);

    return Number(output || 0);
  }

  private async fetchCreditDetail(whereClause: string) {
    const query = `
      SELECT JSON_OBJECT(
        'id', cr.id,
        'partner_id', cr.partner_id,
        'business_id', cr.business_id,
        'deposit', cr.deposit,
        'credit', cr.credit,
        'note', cr.note,
        'created', cr.created,
        'updated', cr.updated,
        'partner_name', partner.name,
        'business_name', b.name,
        'customer_name', c.name,
        'product_name', p.name,
        'product_version', p.version
      ) AS payload
      FROM credit cr
      LEFT JOIN partner ON cr.partner_id = partner.id AND partner.removed IS NULL
      LEFT JOIN business b ON cr.business_id = b.id AND b.removed IS NULL
      LEFT JOIN customer c ON b.customer_id = c.id AND c.removed IS NULL
      LEFT JOIN product p ON b.product_id = p.id AND p.removed IS NULL
      ${whereClause}
      LIMIT 1
    `;
    const output = await this.databaseService.runMysqlQuery(query);

    return output ? JSON.parse(output) : null;
  }

  private async fetchPartnerOptions(authContext?: AuthContext) {
    const conditions = ["removed IS NULL"];

    if (authContext?.role === "user") {
      const scope = await this.fetchUserScope(authContext);

      if (scope.type === "partner" && scope.companyId) {
        conditions.push(`id = ${scope.companyId}`);
      } else if (scope.type !== "customer") {
        conditions.push("1 = 0");
      }
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
        FROM partner
        WHERE ${conditions.join(" AND ")}
        ORDER BY name ASC
      ) result
    `;
    const output = await this.databaseService.runMysqlQuery(query);

    return output ? JSON.parse(output) : [];
  }

  private async fetchBusinessOptions(authContext?: AuthContext) {
    const conditions = ["b.removed IS NULL"];

    if (authContext?.role === "user") {
      const scope = await this.fetchUserScope(authContext);

      if (scope.type === "customer" && scope.companyId) {
        conditions.push(`b.customer_id = ${scope.companyId}`);
      }
    }

    const query = `
      SELECT COALESCE(
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', result.id,
            'label', result.label
          )
        ),
        JSON_ARRAY()
      ) AS payload
      FROM (
        SELECT
          b.id,
          CONCAT(
            COALESCE(NULLIF(b.name, ''), '-'),
            ' / ',
            COALESCE(NULLIF(c.name, ''), '-')
          ) AS label
        FROM business b
        LEFT JOIN customer c ON b.customer_id = c.id AND c.removed IS NULL
        WHERE ${conditions.join(" AND ")}
        ORDER BY b.created DESC
      ) result
    `;
    const output = await this.databaseService.runMysqlQuery(query);

    return output ? JSON.parse(output) : [];
  }

  private async buildWhereClause(query: CreditQuery, authContext?: AuthContext) {
    const conditions = ["cr.removed IS NULL"];
    const searchColumnMap: Record<string, string> = {
      partner: "partner.name",
      business: "b.name",
      customer: "c.name",
      note: "cr.note",
    };

    await this.appendAccessConditions(conditions, authContext);

    if (authContext?.role === "user") {
      const companyId = await this.userService.fetchUserCompanyId(authContext.userId || "");

      if (!companyId) {
        conditions.push("1 = 0");
      } else {
        conditions.push(`cr.partner_id = ${companyId}`);
      }
    }

    if (query.kind === "purchase") {
      conditions.push("cr.deposit IS NOT NULL");
    } else if (query.kind === "use") {
      conditions.push("cr.credit IS NOT NULL");
    }

    if (query.keyword && query.searchType && searchColumnMap[query.searchType]) {
      const escapedKeyword = this.databaseService.escapeLike(query.keyword);
      conditions.push(
        `${searchColumnMap[query.searchType]} LIKE '%${escapedKeyword}%' ESCAPE '\\\\'`
      );
    }

    return `WHERE ${conditions.join(" AND ")}`;
  }

  private async buildDetailWhereClause(id: string, authContext?: AuthContext) {
    const parsedId = Number(id);
    const conditions = ["cr.removed IS NULL"];

    if (!Number.isInteger(parsedId) || parsedId < 1) {
      conditions.push("1 = 0");
    } else {
      conditions.push(`cr.id = ${parsedId}`);
    }

    await this.appendAccessConditions(conditions, authContext);

    return `WHERE ${conditions.join(" AND ")}`;
  }

  private async appendAccessConditions(conditions: string[], authContext?: AuthContext) {
    if (authContext?.role !== "user") {
      return;
    }

    const scope = await this.fetchUserScope(authContext);

    if (!scope.companyId) {
      conditions.push("1 = 0");
      return;
    }

    if (scope.type === "partner") {
      conditions.push(`cr.partner_id = ${scope.companyId}`);
      return;
    }

    if (scope.type === "customer") {
      conditions.push(`b.customer_id = ${scope.companyId}`);
      return;
    }

    conditions.push("1 = 0");
  }

  private normalizeInput(input: CreditInput) {
    const partnerId = this.parseRequiredPositiveInteger(input.partnerId, "파트너를 선택해주세요.");
    const businessId = this.parseNullablePositiveInteger(input.businessId, "유효한 사업을 선택해주세요.");
    const deposit = this.parseNullableNonNegativeInteger(input.deposit, "구매 크레딧은 0 이상이어야 합니다.");
    const credit = this.parseNullableNonNegativeInteger(input.credit, "사용 크레딧은 0 이상이어야 합니다.");
    const note = String(input.note || "").trim();

    if (deposit === null && credit === null) {
      throw new BadRequestException("구매 크레딧 또는 사용 크레딧을 입력해주세요.");
    }

    return {
      partnerId,
      businessId,
      deposit,
      credit,
      note,
    };
  }

  private async ensurePartnerAccess(partnerId: number, authContext?: AuthContext) {
    if (authContext?.role === "user") {
      const scope = await this.fetchUserScope(authContext);

      if (scope.type === "partner" && scope.companyId !== partnerId) {
        throw new BadRequestException("파트너 선택 권한이 없습니다.");
      }
    }

    const output = await this.databaseService.runMysqlQuery(`
      SELECT id
      FROM partner
      WHERE id = ${partnerId}
        AND removed IS NULL
      LIMIT 1
    `);

    if (!output) {
      throw new BadRequestException("파트너를 찾을 수 없습니다.");
    }
  }

  private async ensureBusinessExists(businessId: number, authContext?: AuthContext) {
    const conditions = [`b.id = ${businessId}`, "b.removed IS NULL"];

    if (authContext?.role === "user") {
      const scope = await this.fetchUserScope(authContext);

      if (scope.type === "customer" && scope.companyId) {
        conditions.push(`b.customer_id = ${scope.companyId}`);
      }
    }

    const output = await this.databaseService.runMysqlQuery(`
      SELECT b.id
      FROM business b
      WHERE ${conditions.join(" AND ")}
      LIMIT 1
    `);

    if (!output) {
      throw new BadRequestException("사업을 찾을 수 없습니다.");
    }
  }

  private async fetchUserScope(authContext?: AuthContext) {
    const userId = authContext?.userId || "";
    const companyId = this.normalizeCompanyId(await this.userService.fetchUserCompanyId(userId));
    const type = await this.fetchUserType(userId);

    return {
      companyId,
      type,
    };
  }

  private async fetchUserType(userId: string) {
    if (!userId) {
      return "";
    }

    const env = getEnv();
    const escapedUserId = this.databaseService.escapeSqlString(userId);
    const query = `
      SELECT VALUE
      FROM ${env.DB_DATABASE_USER}.USER_ATTRIBUTE
      WHERE USER_ID = '${escapedUserId}'
        AND NAME = 'type'
      LIMIT 1
    `;
    const output = await this.databaseService.runMysqlQuery(query);

    return String(output || "").trim().toLowerCase();
  }

  private parseRequiredPositiveInteger(value: number | string | undefined, message: string) {
    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed < 1) {
      throw new BadRequestException(message);
    }

    return parsed;
  }

  private parseNullablePositiveInteger(value: number | string | undefined, message: string) {
    if (value === undefined || value === null || String(value).trim() === "") {
      return null;
    }

    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed < 1) {
      throw new BadRequestException(message);
    }

    return parsed;
  }

  private parseNullableNonNegativeInteger(value: number | string | undefined, message: string) {
    if (value === undefined || value === null || String(value).trim() === "") {
      return null;
    }

    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed < 0) {
      throw new BadRequestException(message);
    }

    return parsed;
  }

  private normalizeCompanyId(value: string) {
    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed < 1) {
      return 0;
    }

    return parsed;
  }

  private sqlNullableString(value: string) {
    if (!value) {
      return "NULL";
    }

    return `'${this.databaseService.escapeSqlString(value)}'`;
  }

  private sqlNullableNumber(value: number | null) {
    if (value === null) {
      return "NULL";
    }

    return String(value);
  }
}
