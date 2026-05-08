import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { getEnv } from "../env";
import { DatabaseService } from "../database/database.service";
import { UserService } from "../user/user.service";

type CustomerQuery = {
  searchType?: string;
  keyword?: string;
  page?: string;
  limit?: string;
};

type AuthContext = {
  userId?: string;
  role?: string;
  preferred_username?: string;
};

type CreateCustomerInput = {
  name?: string;
  telnum?: string;
  managerId?: string;
  managerCompanyId?: string | number;
};

type UpdateCustomerInput = CreateCustomerInput;

@Injectable()
export class CustomerService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly userService: UserService
  ) {}

  async getCustomers(query: CustomerQuery, authContext?: AuthContext) {
    const page = Math.max(Number(query.page || 1), 1);
    const limit = Math.min(Math.max(Number(query.limit || 10), 1), 100);
    const offset = (page - 1) * limit;
    const whereClause = await this.buildWhereClause(query, authContext);
    const items = await this.fetchCustomerItems(whereClause, limit, offset);
    const total = await this.fetchCustomerCount(whereClause);

    return {
      items: items.map((item: any) => ({
        id: item.id,
        name: item.name || "-",
        phone: item.telnum || "-",
        manager: this.formatManagerLabel(item.manager_name, item.manager_company_name),
        createdAt: item.created || "-",
      })),
      pagination: {
        page,
        limit,
        total,
      },
    };
  }

  async getCustomerFormOptions(authContext?: AuthContext) {
    const managerOptions = await this.fetchManagerOptions(authContext);

    return {
      managerOptions,
    };
  }

  async getCustomerDetail(id: string) {
    const parsedId = Number(id);

    if (!Number.isInteger(parsedId) || parsedId < 1) {
      throw new NotFoundException("고객 정보를 찾을 수 없습니다.");
    }

    const item = await this.fetchCustomerDetail(parsedId);

    if (!item) {
      throw new NotFoundException("고객 정보를 찾을 수 없습니다.");
    }

    const [managers, businesses] = await Promise.all([
      this.fetchCustomerManagers(parsedId),
      this.fetchCustomerBusinesses(parsedId),
    ]);

    return {
      id: item.id,
      name: item.name || "-",
      phone: item.telnum || "-",
      createdAt: item.created || "-",
      managerId: item.manager_id || "",
      managerCompanyId: item.manager_company_id || "",
      manager: this.formatManagerLabel(item.manager_name, item.manager_company_name),
      managers,
      businesses,
    };
  }

  async createCustomer(input: CreateCustomerInput) {
    const name = String(input.name || "").trim();
    const telnum = String(input.telnum || "").trim();
    const managerId = String(input.managerId || "").trim();
    const managerCompanyId = String(input.managerCompanyId || "").trim();

    if (!name) {
      throw new BadRequestException("회사명을 입력해주세요.");
    }

    if (!telnum) {
      throw new BadRequestException("전화번호를 입력해주세요.");
    }

    if (!managerId) {
      throw new BadRequestException("고객 관리 파트너를 선택해주세요.");
    }

    if (!managerCompanyId) {
      throw new BadRequestException("고객 관리 파트너 회사 정보가 올바르지 않습니다.");
    }

    const escapedName = this.databaseService.escapeSqlString(name);
    const escapedTelnum = this.databaseService.escapeSqlString(telnum);
    const escapedManagerId = this.databaseService.escapeSqlString(managerId);
    const escapedManagerCompanyId = this.databaseService.escapeSqlString(managerCompanyId);
    const insertQuery = `
      INSERT INTO customer (
        name,
        telnum,
        manager_id,
        manager_company_id
      )
      VALUES (
        '${escapedName}',
        '${escapedTelnum}',
        '${escapedManagerId}',
        '${escapedManagerCompanyId}'
      );
      SELECT LAST_INSERT_ID();
    `;
    const createdId = Number(await this.databaseService.runMysqlQuery(insertQuery));

    return {
      id: createdId,
      message: "고객이 등록되었습니다.",
    };
  }

  async updateCustomer(id: string, input: UpdateCustomerInput) {
    const parsedId = Number(id);

    if (!Number.isInteger(parsedId) || parsedId < 1) {
      throw new BadRequestException("유효한 고객 정보가 아닙니다.");
    }

    const customer = await this.fetchCustomerDetail(parsedId);

    if (!customer) {
      throw new NotFoundException("수정할 고객 정보를 찾을 수 없습니다.");
    }

    const name = String(input.name || "").trim();
    const telnum = String(input.telnum || "").trim();
    const managerId = String(input.managerId || "").trim();
    const managerCompanyId = String(input.managerCompanyId || "").trim();

    if (!name) {
      throw new BadRequestException("회사명을 입력해주세요.");
    }

    if (!telnum) {
      throw new BadRequestException("전화번호를 입력해주세요.");
    }

    if (!managerId) {
      throw new BadRequestException("고객 관리 파트너를 선택해주세요.");
    }

    if (!managerCompanyId) {
      throw new BadRequestException("고객 관리 파트너 회사 정보가 올바르지 않습니다.");
    }

    const escapedName = this.databaseService.escapeSqlString(name);
    const escapedTelnum = this.databaseService.escapeSqlString(telnum);
    const escapedManagerId = this.databaseService.escapeSqlString(managerId);
    const escapedManagerCompanyId = this.databaseService.escapeSqlString(managerCompanyId);
    const updateQuery = `
      UPDATE customer
      SET name = '${escapedName}',
          telnum = '${escapedTelnum}',
          manager_id = '${escapedManagerId}',
          manager_company_id = '${escapedManagerCompanyId}',
          updated = CURRENT_TIMESTAMP(6)
      WHERE id = ${parsedId}
    `;
    await this.databaseService.runMysqlQuery(updateQuery);

    return {
      id: parsedId,
      message: "고객이 수정되었습니다.",
    };
  }

  async deleteCustomer(id: string) {
    const parsedId = Number(id);

    if (!Number.isInteger(parsedId) || parsedId < 1) {
      throw new BadRequestException("유효한 고객 정보가 아닙니다.");
    }

    const customer = await this.fetchCustomerDetail(parsedId);

    if (!customer) {
      throw new NotFoundException("삭제할 고객 정보를 찾을 수 없습니다.");
    }

    if (await this.hasCompanyManagers(parsedId, "customer")) {
      throw new BadRequestException("담당자를 먼저 삭제하세요.");
    }

    if (await this.hasCustomerBusinesses(parsedId)) {
      throw new BadRequestException("사업정보를 먼저 삭제하세요.");
    }

    const deleteQuery = `
      UPDATE customer
      SET removed = CURRENT_TIMESTAMP(6),
          updated = CURRENT_TIMESTAMP(6)
      WHERE id = ${parsedId}
    `;
    await this.databaseService.runMysqlQuery(deleteQuery);

    return {
      id: parsedId,
      message: "고객이 삭제되었습니다.",
    };
  }

  private async fetchCustomerItems(whereClause: string, limit: number, offset: number) {
    const env = getEnv();
    const query = `
      SELECT COALESCE(
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', result.id,
            'name', result.name,
            'telnum', result.telnum,
            'manager_name', result.manager_name,
            'manager_company_name', result.manager_company_name,
            'created', result.created
          )
        ),
        JSON_ARRAY()
      ) AS payload
      FROM (
        SELECT
          c.id,
          c.name,
          c.telnum,
          c.created,
          u.USERNAME AS manager_name,
          partner.name AS manager_company_name
        FROM customer c
        LEFT JOIN ${env.DB_DATABASE_USER}.USER_ENTITY u ON c.manager_id = u.ID
        LEFT JOIN partner ON c.manager_company_id = CAST(partner.id AS CHAR) AND partner.removed IS NULL
        ${whereClause}
        ORDER BY c.id DESC
        LIMIT ${limit} OFFSET ${offset}
      ) result
    `;
    const output = await this.databaseService.runMysqlQuery(query);

    return output ? JSON.parse(output) : [];
  }

  private async fetchCustomerDetail(customerId: number) {
    const env = getEnv();
    const query = `
      SELECT JSON_OBJECT(
        'id', c.id,
        'name', c.name,
        'telnum', c.telnum,
        'created', c.created,
        'manager_id', c.manager_id,
        'manager_company_id', c.manager_company_id,
        'manager_name', u.USERNAME,
        'manager_company_name', partner.name
      ) AS payload
      FROM customer c
      LEFT JOIN ${env.DB_DATABASE_USER}.USER_ENTITY u ON c.manager_id = u.ID
      LEFT JOIN partner ON c.manager_company_id = CAST(partner.id AS CHAR) AND partner.removed IS NULL
      WHERE c.id = ${customerId}
        AND c.removed IS NULL
      LIMIT 1
    `;
    const output = await this.databaseService.runMysqlQuery(query);

    return output ? JSON.parse(output) : null;
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

  private async hasCustomerBusinesses(customerId: number) {
    const query = `
      SELECT COUNT(*)
      FROM business
      WHERE customer_id = ${customerId}
        AND removed IS NULL
    `;
    const output = await this.databaseService.runMysqlQuery(query);

    return Number(output || 0) > 0;
  }

  private async fetchCustomerCount(whereClause: string) {
    const env = getEnv();
    const query = `
      SELECT COUNT(*)
      FROM customer c
      LEFT JOIN ${env.DB_DATABASE_USER}.USER_ENTITY u ON c.manager_id = u.ID
      LEFT JOIN partner ON c.manager_company_id = CAST(partner.id AS CHAR) AND partner.removed IS NULL
      ${whereClause}
    `;
    const output = await this.databaseService.runMysqlQuery(query);

    return Number(output || 0);
  }

  private async fetchManagerOptions(authContext?: AuthContext) {
    const env = getEnv();
    const conditions = ["uc.company_id IS NOT NULL", "partner.id IS NOT NULL"];

    if (authContext?.role === "user") {
      const companyId = this.normalizeCompanyId(
        await this.userService.fetchUserCompanyId(authContext.userId || "")
      );

      if (!companyId) {
        return [];
      }

      conditions.push(`uc.company_id = '${companyId}'`);
    }

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
      )
      SELECT COALESCE(
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', result.id,
            'label', result.label,
            'companyId', result.company_id
          )
        ),
        JSON_ARRAY()
      ) AS payload
      FROM (
        SELECT
          u.ID AS id,
          uc.company_id AS company_id,
          CONCAT(
            COALESCE(NULLIF(u.USERNAME, ''), '-'),
            ' (',
            COALESCE(NULLIF(partner.name, ''), '파트너 미지정'),
            ')'
          ) AS label
        FROM ${env.DB_DATABASE_USER}.USER_ENTITY u
        INNER JOIN user_type ut ON u.ID = ut.user_id
        LEFT JOIN user_company uc ON u.ID = uc.user_id
        LEFT JOIN partner ON uc.company_id = CAST(partner.id AS CHAR) AND partner.removed IS NULL
        WHERE ${conditions.join(" AND ")}
        ORDER BY partner.name ASC, u.USERNAME ASC
      ) result
    `;
    const output = await this.databaseService.runMysqlQuery(query);

    return output ? JSON.parse(output) : [];
  }

  private async fetchCustomerManagers(customerId: number) {
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
          AND VALUE = 'customer'
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
        WHERE uc.company_id = '${customerId}'
        GROUP BY u.ID, u.USERNAME, u.EMAIL, u.FIRST_NAME, utn.telnum
        ORDER BY u.USERNAME ASC
      ) result
    `;
    const output = await this.databaseService.runMysqlQuery(query);

    return output ? JSON.parse(output) : [];
  }

  private async fetchCustomerBusinesses(customerId: number) {
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
          AND VALUE IN ('partner', 'vendor')
      )
      SELECT COALESCE(
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', result.id,
            'project', result.project,
            'manager', result.manager,
            'status', result.status,
            'product', result.product,
            'startDate', result.start_date,
            'endDate', result.end_date
          )
        ),
        JSON_ARRAY()
      ) AS payload
      FROM (
        SELECT
          b.id,
          b.name AS project,
          CONCAT(
            COALESCE(NULLIF(u.USERNAME, ''), '-'),
            ' (',
            CASE
              WHEN ut.type = 'partner' THEN COALESCE(NULLIF(partner.name, ''), '-')
              ELSE 'ABLECLOUD'
            END,
            ')'
          ) AS manager,
          b.status,
          CONCAT(
            COALESCE(NULLIF(p.name, ''), '-'),
            CASE
              WHEN p.version IS NOT NULL AND p.version <> '' THEN CONCAT(' (v', p.version, ')')
              ELSE ''
            END
          ) AS product,
          b.issued AS start_date,
          b.expired AS end_date
        FROM business b
        LEFT JOIN product p ON b.product_id = p.id
        LEFT JOIN ${env.DB_DATABASE_USER}.USER_ENTITY u ON b.manager_id = u.ID
        LEFT JOIN user_company uc ON u.ID = uc.user_id
        LEFT JOIN user_type ut ON u.ID = ut.user_id
        LEFT JOIN partner ON uc.company_id = CAST(partner.id AS CHAR)
        WHERE b.customer_id = ${customerId}
          AND b.removed IS NULL
        ORDER BY b.created DESC
      ) result
    `;
    const output = await this.databaseService.runMysqlQuery(query);

    return output ? JSON.parse(output) : [];
  }

  private async buildWhereClause(query: CustomerQuery, authContext?: AuthContext) {
    const conditions = ["c.removed IS NULL"];

    if (authContext?.role === "user") {
      const companyId = this.normalizeCompanyId(
        await this.userService.fetchUserCompanyId(authContext.userId || "")
      );

      if (!companyId) {
        conditions.push("1 = 0");
      } else {
        conditions.push(`c.manager_company_id = ${companyId}`);
      }
    }

    if (query.keyword) {
      const escapedKeyword = this.databaseService.escapeLike(String(query.keyword));

      if (query.searchType === "managerCompany") {
        conditions.push(`partner.name LIKE '%${escapedKeyword}%' ESCAPE '\\\\'`);
      } else {
        conditions.push(`c.name LIKE '%${escapedKeyword}%' ESCAPE '\\\\'`);
      }
    }

    return `WHERE ${conditions.join(" AND ")}`;
  }

  private normalizeCompanyId(value: string) {
    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed < 1) {
      return 0;
    }

    return parsed;
  }

  private formatManagerLabel(managerName?: string, managerCompanyName?: string) {
    const userLabel = String(managerName || "").trim();
    const companyLabel = String(managerCompanyName || "").trim();

    if (userLabel && companyLabel) {
      return `${userLabel} (${companyLabel})`;
    }

    return userLabel || companyLabel || "-";
  }
}
