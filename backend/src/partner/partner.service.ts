import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { getEnv } from "../env";
import { UserService } from "../user/user.service";

type PartnerQuery = {
  searchType?: string;
  keyword?: string;
  level?: string;
  page?: string;
  limit?: string;
};

type AuthContext = {
  userId?: string;
  role?: string;
  preferred_username?: string;
};

type CreatePartnerInput = {
  name?: string;
  level?: string;
  telnum?: string;
  productCategory?: string | string[];
};

type UpdatePartnerInput = CreatePartnerInput;

type ProductCategoryMap = Record<string, string>;

const VALID_LEVELS = ["PLATINUM", "GOLD", "SILVER", "VAR"];

@Injectable()
export class PartnerService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly userService: UserService
  ) {}

  async getPartners(query: PartnerQuery, authContext?: AuthContext) {
    const page = Math.max(Number(query.page || 1), 1);
    const limit = Math.min(Math.max(Number(query.limit || 10), 1), 100);
    const offset = (page - 1) * limit;
    const whereClause = await this.buildWhereClause(query, authContext);
    const items = await this.fetchPartnerItems(whereClause, limit, offset);
    const total = await this.fetchPartnerCount(whereClause);
    const productCategoryMap = await this.fetchProductCategoryMap();

    return {
      items: items.map((item: any) => ({
        id: item.id,
        name: item.name || "-",
        phone: item.telnum || "-",
        grade: item.level || "-",
        productCategory: this.resolveProductCategoryLabel(item.product_category, productCategoryMap),
        createdAt: item.created || "-",
      })),
      pagination: {
        page,
        limit,
        total,
      },
    };
  }

  async getPartnerDetail(id: string) {
    const parsedId = Number(id);

    if (!Number.isInteger(parsedId) || parsedId < 1) {
      throw new NotFoundException("파트너 정보를 찾을 수 없습니다.");
    }

    const item = await this.fetchPartnerDetail(parsedId);
    const productCategoryMap = await this.fetchProductCategoryMap();
    const [managers, creditSummary] = await Promise.all([
      this.fetchPartnerManagers(parsedId),
      this.fetchPartnerCreditSummary(parsedId),
    ]);

    if (!item) {
      throw new NotFoundException("파트너 정보를 찾을 수 없습니다.");
    }

    return {
      id: item.id,
      name: item.name || "-",
      phone: item.telnum || "-",
      grade: item.level || "-",
      productCategory: this.resolveProductCategoryLabel(item.product_category, productCategoryMap) || "-",
      productCategoryIds: this.resolveProductCategoryIds(item.product_category, productCategoryMap),
      createdAt: item.created || "-",
      creditSummary,
      managers,
    };
  }

  async createPartner(input: CreatePartnerInput) {
    const name = String(input.name || "").trim();
    const level = String(input.level || "GOLD").trim().toUpperCase();
    const telnum = String(input.telnum || "").trim();
    const productCategory = await this.normalizeProductCategory(input.productCategory);

    if (!name) {
      throw new BadRequestException("회사명을 입력해주세요.");
    }

    if (!VALID_LEVELS.includes(level)) {
      throw new BadRequestException("유효한 파트너 등급을 선택해주세요.");
    }

    if (!telnum) {
      throw new BadRequestException("전화번호를 입력해주세요.");
    }

    const escapedName = this.databaseService.escapeSqlString(name);
    const escapedLevel = this.databaseService.escapeSqlString(level);
    const escapedTelnum = this.databaseService.escapeSqlString(telnum);
    const escapedProductCategory = this.databaseService.escapeSqlString(productCategory);
    const productCategoryValue = productCategory ? `'${escapedProductCategory}'` : "NULL";
    const insertQuery = `
      INSERT INTO partner (
        name,
        level,
        telnum,
        product_category
      )
      VALUES (
        '${escapedName}',
        '${escapedLevel}',
        '${escapedTelnum}',
        ${productCategoryValue}
      );
      SELECT LAST_INSERT_ID();
    `;
    const createdId = Number(await this.databaseService.runMysqlQuery(insertQuery));

    return {
      id: createdId,
      message: "파트너가 등록되었습니다.",
    };
  }

  async updatePartner(id: string, input: UpdatePartnerInput) {
    const parsedId = Number(id);

    if (!Number.isInteger(parsedId) || parsedId < 1) {
      throw new BadRequestException("유효한 파트너 정보가 아닙니다.");
    }

    const partner = await this.fetchPartnerDetail(parsedId);

    if (!partner) {
      throw new NotFoundException("수정할 파트너 정보를 찾을 수 없습니다.");
    }

    const name = String(input.name || "").trim();
    const level = String(input.level || "GOLD").trim().toUpperCase();
    const telnum = String(input.telnum || "").trim();
    const productCategory = await this.normalizeProductCategory(input.productCategory);

    if (!name) {
      throw new BadRequestException("회사명을 입력해주세요.");
    }

    if (!VALID_LEVELS.includes(level)) {
      throw new BadRequestException("유효한 파트너 등급을 선택해주세요.");
    }

    if (!telnum) {
      throw new BadRequestException("전화번호를 입력해주세요.");
    }

    const escapedName = this.databaseService.escapeSqlString(name);
    const escapedLevel = this.databaseService.escapeSqlString(level);
    const escapedTelnum = this.databaseService.escapeSqlString(telnum);
    const escapedProductCategory = this.databaseService.escapeSqlString(productCategory);
    const productCategoryValue = productCategory ? `'${escapedProductCategory}'` : "NULL";
    const updateQuery = `
      UPDATE partner
      SET name = '${escapedName}',
          level = '${escapedLevel}',
          telnum = '${escapedTelnum}',
          product_category = ${productCategoryValue},
          updated = CURRENT_TIMESTAMP(6)
      WHERE id = ${parsedId}
    `;
    await this.databaseService.runMysqlQuery(updateQuery);

    return {
      id: parsedId,
      message: "파트너가 수정되었습니다.",
    };
  }

  async deletePartner(id: string) {
    const parsedId = Number(id);

    if (!Number.isInteger(parsedId) || parsedId < 1) {
      throw new BadRequestException("유효한 파트너 정보가 아닙니다.");
    }

    const partner = await this.fetchPartnerDetail(parsedId);

    if (!partner) {
      throw new NotFoundException("삭제할 파트너 정보를 찾을 수 없습니다.");
    }

    if (await this.hasCompanyManagers(parsedId, "partner")) {
      throw new BadRequestException("담당자를 먼저 삭제하세요.");
    }

    const deleteQuery = `
      UPDATE partner
      SET removed = CURRENT_TIMESTAMP(6),
          updated = CURRENT_TIMESTAMP(6)
      WHERE id = ${parsedId}
    `;
    await this.databaseService.runMysqlQuery(deleteQuery);

    return {
      id: parsedId,
      message: "파트너가 삭제되었습니다.",
    };
  }

  private async fetchPartnerItems(whereClause: string, limit: number, offset: number) {
    const query = `
      SELECT COALESCE(
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', result.id,
            'name', result.name,
            'level', result.level,
            'telnum', result.telnum,
            'product_category', result.product_category,
            'created', result.created
          )
        ),
        JSON_ARRAY()
      ) AS payload
      FROM (
        SELECT
          p.id,
          p.name,
          p.level,
          p.telnum,
          p.product_category,
          p.created
        FROM partner p
        ${whereClause}
        ORDER BY p.id DESC
        LIMIT ${limit} OFFSET ${offset}
      ) result
    `;
    const output = await this.databaseService.runMysqlQuery(query);

    return output ? JSON.parse(output) : [];
  }

  private async fetchPartnerDetail(partnerId: number) {
    const query = `
      SELECT JSON_OBJECT(
        'id', p.id,
        'name', p.name,
        'level', p.level,
        'telnum', p.telnum,
        'product_category', p.product_category,
        'created', p.created
      ) AS payload
      FROM partner p
      WHERE p.id = ${partnerId}
        AND p.removed IS NULL
      LIMIT 1
    `;
    const output = await this.databaseService.runMysqlQuery(query);

    return output ? JSON.parse(output) : null;
  }

  private async fetchPartnerCount(whereClause: string) {
    const query = `
      SELECT COUNT(*)
      FROM partner p
      ${whereClause}
    `;
    const output = await this.databaseService.runMysqlQuery(query);

    return Number(output || 0);
  }

  private async fetchPartnerManagers(partnerId: number) {
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
          AND VALUE = 'partner'
      ),
      user_telnum AS (
        SELECT USER_ID AS user_id, MAX(VALUE) AS telnum
        FROM ${env.DB_DATABASE_USER}.USER_ATTRIBUTE
        WHERE NAME = 'telnum'
        GROUP BY USER_ID
      )
      SELECT COALESCE(
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', result.username,
            'email', result.email,
            'name', result.name,
            'phone', result.telnum
          )
        ),
        JSON_ARRAY()
      ) AS payload
      FROM (
        SELECT
          u.USERNAME AS username,
          COALESCE(NULLIF(u.EMAIL, ''), '-') AS email,
          COALESCE(NULLIF(TRIM(COALESCE(u.FIRST_NAME, '')), ''), u.USERNAME, '-') AS name,
          COALESCE(NULLIF(utn.telnum, ''), '-') AS telnum
        FROM ${env.DB_DATABASE_USER}.USER_ENTITY u
        INNER JOIN user_company uc ON u.ID = uc.user_id
        INNER JOIN user_type ut ON u.ID = ut.user_id
        LEFT JOIN user_telnum utn ON u.ID = utn.user_id
        WHERE uc.company_id = '${partnerId}'
        GROUP BY u.ID, u.USERNAME, u.EMAIL, u.FIRST_NAME, utn.telnum
        ORDER BY u.USERNAME ASC
      ) result
    `;
    const output = await this.databaseService.runMysqlQuery(query);

    return output ? JSON.parse(output) : [];
  }

  private async hasCompanyManagers(companyId: number, type: "partner" | "customer") {
    const env = getEnv();
    const escapedType = this.databaseService.escapeSqlString(type);
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
          AND VALUE = '${escapedType}'
      )
      SELECT COUNT(DISTINCT u.ID)
      FROM ${env.DB_DATABASE_USER}.USER_ENTITY u
      INNER JOIN user_company uc ON u.ID = uc.user_id
      INNER JOIN user_type ut ON u.ID = ut.user_id
      WHERE uc.company_id = '${companyId}'
    `;
    const output = await this.databaseService.runMysqlQuery(query);

    return Number(output || 0) > 0;
  }

  private async fetchPartnerCreditSummary(partnerId: number) {
    const query = `
      SELECT JSON_OBJECT(
        'purchase', result.purchase,
        'use', result.use_credit,
        'remaining', result.purchase - result.use_credit
      ) AS payload
      FROM (
        SELECT
          COALESCE(SUM(COALESCE(deposit, 0)), 0) AS purchase,
          COALESCE(SUM(COALESCE(credit, 0)), 0) AS use_credit
        FROM credit
        WHERE partner_id = ${partnerId}
          AND removed IS NULL
      ) result
    `;
    const output = await this.databaseService.runMysqlQuery(query);
    const summary = output ? JSON.parse(output) : null;

    if (!summary || Number(summary.use || 0) <= 0) {
      return null;
    }

    return {
      purchase: Number(summary.purchase || 0),
      use: Number(summary.use || 0),
      remaining: Number(summary.remaining || 0),
    };
  }

  private async fetchProductCategoryMap(): Promise<ProductCategoryMap> {
    const query = `
      SELECT COALESCE(
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', pc.id,
            'name', pc.name
          )
        ),
        JSON_ARRAY()
      ) AS payload
      FROM product_category pc
      WHERE pc.removed IS NULL
        AND pc.enabled = 1
    `;
    const output = await this.databaseService.runMysqlQuery(query);
    const items = output ? JSON.parse(output) : [];

    return items.reduce((acc: ProductCategoryMap, item: any) => {
      const id = String(item.id || "").trim();
      const name = String(item.name || "").trim();

      if (id && name) {
        acc[id] = name;
      }

      return acc;
    }, {} as ProductCategoryMap);
  }

  private async buildWhereClause(query: PartnerQuery, authContext?: AuthContext) {
    const conditions = ["p.removed IS NULL"];

    if (authContext?.role === "user") {
      const companyId = await this.userService.fetchUserCompanyId(authContext.userId || "");

      if (!companyId) {
        conditions.push("1 = 0");
      } else {
        conditions.push(`p.id = ${companyId}`);
      }
    }

    if (query.level && VALID_LEVELS.includes(String(query.level).toUpperCase())) {
      const escapedLevel = this.databaseService.escapeSqlString(String(query.level).toUpperCase());
      conditions.push(`p.level = '${escapedLevel}'`);
    }

    if (query.keyword) {
      const escapedKeyword = this.databaseService.escapeLike(String(query.keyword));

      if (query.searchType === "phone") {
        conditions.push(`p.telnum LIKE '%${escapedKeyword}%' ESCAPE '\\\\'`);
      } else {
        conditions.push(`p.name LIKE '%${escapedKeyword}%' ESCAPE '\\\\'`);
      }
    }

    return `WHERE ${conditions.join(" AND ")}`;
  }

  private resolveProductCategoryLabel(value: string, productCategoryMap: ProductCategoryMap) {
    const tokens = String(value || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (tokens.length === 0) {
      return "";
    }

    return tokens.map((token) => productCategoryMap[token] || token).join(", ");
  }

  private resolveProductCategoryIds(value: string, productCategoryMap: ProductCategoryMap) {
    const categoryIdByName = (Object.entries(productCategoryMap) as Array<[string, string]>).reduce((acc, [id, name]) => {
      acc[name] = id;
      return acc;
    }, {} as ProductCategoryMap);
    const tokens = String(value || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    return tokens.map((token) => categoryIdByName[token] || token).join(",");
  }

  private async normalizeProductCategory(value: CreatePartnerInput["productCategory"]) {
    const tokens = Array.isArray(value)
      ? value.map((item) => String(item || "").trim()).filter(Boolean)
      : String(value || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);

    if (tokens.length === 0) {
      return "";
    }

    const productCategoryMap = await this.fetchProductCategoryMap();
    const categoryIdByName = (Object.entries(productCategoryMap) as Array<[string, string]>).reduce((acc, [id, name]) => {
      acc[name] = id;
      return acc;
    }, {} as ProductCategoryMap);
    const normalizedIds = tokens.map((token) => {
      if (productCategoryMap[token]) {
        return token;
      }

      return categoryIdByName[token] || "";
    });

    if (normalizedIds.some((id) => !id)) {
      throw new BadRequestException("유효한 제품 카테고리를 선택해주세요.");
    }

    return [...new Set(normalizedIds)].join(",");
  }
}
