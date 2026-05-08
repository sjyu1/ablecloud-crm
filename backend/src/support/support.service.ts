import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { getEnv } from "../env";
import { DatabaseService } from "../database/database.service";
import { UserService } from "../user/user.service";

type SupportQuery = {
  searchType?: string;
  keyword?: string;
  type?: string;
  status?: string;
  page?: string;
  limit?: string;
};

type SupportInput = {
  customerId?: number | string;
  businessId?: number | string;
  issued?: string;
  type?: string;
  issue?: string;
  solution?: string;
  actioned?: string;
  actionType?: string;
  manager?: string;
  status?: string;
  requester?: string;
  requesterTelnum?: string;
  requesterEmail?: string;
  writer?: string;
  note?: string;
};

type AuthContext = {
  userId?: string;
  role?: string;
  preferred_username?: string;
};

type UserScope = {
  companyId: number;
  type: string;
};

const SUPPORT_TYPES = ["poc", "consult", "technical", "other", "incident"];
const ACTION_TYPES = ["mail", "remote", "phone", "site"];
const SUPPORT_STATUSES = ["processing", "complete"];

@Injectable()
export class SupportService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly userService: UserService
  ) {}

  async getSupports(query: SupportQuery, authContext?: AuthContext) {
    const page = Math.max(Number(query.page || 1), 1);
    const limit = Math.min(Math.max(Number(query.limit || 10), 1), 100);
    const offset = (page - 1) * limit;
    const whereClause = await this.buildWhereClause(query, authContext);
    const items = await this.fetchSupportItems(whereClause, limit, offset);
    const total = await this.fetchSupportCount(whereClause);

    return {
      items: items.map((item: any) => ({
        id: item.id,
        customer: item.customer_name || "-",
        business: item.business_name || "-",
        issued: item.issued || "-",
        type: this.mapSupportType(item.type),
        issue: item.issue || "-",
        actioned: item.actioned || "-",
        actionType: this.mapActionType(item.action_type),
        manager: item.manager || "-",
        status: this.mapSupportStatus(item.status),
        requester: item.requester || "-",
        createdAt: item.created || "-",
      })),
      pagination: {
        page,
        limit,
        total,
      },
    };
  }

  async getSupportFormOptions(authContext?: AuthContext) {
    const [customerOptions, businessOptions] = await Promise.all([
      this.fetchCustomerOptions(authContext),
      this.fetchBusinessOptions(authContext),
    ]);

    return {
      customerOptions,
      businessOptions,
    };
  }

  async getSupportDetail(id: string, authContext?: AuthContext) {
    const whereClause = await this.buildDetailWhereClause(id, authContext);
    const item = await this.fetchSupportDetail(whereClause);

    if (!item) {
      throw new NotFoundException("기술지원 정보를 찾을 수 없습니다.");
    }

    const [customerOptions, businessOptions] = await Promise.all([
      this.fetchCustomerOptions(authContext),
      this.fetchBusinessOptions(authContext),
    ]);

    return {
      id: item.id,
      customerId: item.customer_id || "",
      customer: item.customer_name || "-",
      businessId: item.business_id || "",
      business: item.business_name || "-",
      product: [item.product_name, item.product_version ? `(v${item.product_version})` : ""]
        .filter(Boolean)
        .join(" ") || "-",
      issued: item.issued || "",
      type: item.type || "consult",
      typeLabel: this.mapSupportType(item.type),
      issue: item.issue || "",
      solution: item.solution || "",
      actioned: item.actioned || "",
      actionType: item.action_type || "phone",
      actionTypeLabel: this.mapActionType(item.action_type),
      manager: item.manager || "",
      status: item.status || "processing",
      statusLabel: this.mapSupportStatus(item.status),
      requester: item.requester || "",
      requesterTelnum: item.requester_telnum || "",
      requesterEmail: item.requester_email || "",
      writer: item.writer || "",
      note: item.note || "",
      createdAt: item.created || "-",
      updatedAt: item.updated || "-",
      customerOptions,
      businessOptions,
    };
  }

  async createSupport(input: SupportInput, authContext?: AuthContext) {
    const normalized = await this.normalizeInput(input, authContext);
    await this.ensureCustomerAccess(normalized.customerId, authContext);

    if (normalized.businessId) {
      await this.ensureBusinessMatchesCustomer(normalized.businessId, normalized.customerId, authContext);
    }

    const insertQuery = `
      INSERT INTO support (
        customer_id,
        business_id,
        issued,
        type,
        issue,
        solution,
        actioned,
        action_type,
        manager,
        status,
        requester,
        requester_telnum,
        requester_email,
        writer,
        note
      ) VALUES (
        ${normalized.customerId},
        ${normalized.businessId || "NULL"},
        ${this.sqlNullableString(normalized.issued)},
        '${this.databaseService.escapeSqlString(normalized.type)}',
        '${this.databaseService.escapeSqlString(normalized.issue)}',
        ${this.sqlNullableString(normalized.solution)},
        ${this.sqlNullableString(normalized.actioned)},
        '${this.databaseService.escapeSqlString(normalized.actionType)}',
        ${this.sqlNullableString(normalized.manager)},
        '${this.databaseService.escapeSqlString(normalized.status)}',
        ${this.sqlNullableString(normalized.requester)},
        ${this.sqlNullableString(normalized.requesterTelnum)},
        ${this.sqlNullableString(normalized.requesterEmail)},
        ${this.sqlNullableString(normalized.writer)},
        ${this.sqlNullableString(normalized.note)}
      );
      SELECT LAST_INSERT_ID();
    `;
    const createdId = Number(await this.databaseService.runMysqlQuery(insertQuery));

    return {
      id: createdId,
      message: "기술지원이 등록되었습니다.",
    };
  }

  async updateSupport(id: string, input: SupportInput, authContext?: AuthContext) {
    const whereClause = await this.buildDetailWhereClause(id, authContext);
    const support = await this.fetchSupportDetail(whereClause);

    if (!support) {
      throw new NotFoundException("수정할 기술지원 정보를 찾을 수 없습니다.");
    }

    const parsedId = Number(id);

    if (!Number.isInteger(parsedId) || parsedId < 1) {
      throw new BadRequestException("유효한 기술지원 정보가 아닙니다.");
    }

    const normalized = await this.normalizeInput(input, authContext);
    await this.ensureCustomerAccess(normalized.customerId, authContext);

    if (normalized.businessId) {
      await this.ensureBusinessMatchesCustomer(normalized.businessId, normalized.customerId, authContext);
    }

    const updateQuery = `
      UPDATE support
      SET customer_id = ${normalized.customerId},
          business_id = ${normalized.businessId || "NULL"},
          issued = ${this.sqlNullableString(normalized.issued)},
          type = '${this.databaseService.escapeSqlString(normalized.type)}',
          issue = '${this.databaseService.escapeSqlString(normalized.issue)}',
          solution = ${this.sqlNullableString(normalized.solution)},
          actioned = ${this.sqlNullableString(normalized.actioned)},
          action_type = '${this.databaseService.escapeSqlString(normalized.actionType)}',
          manager = ${this.sqlNullableString(normalized.manager)},
          status = '${this.databaseService.escapeSqlString(normalized.status)}',
          requester = ${this.sqlNullableString(normalized.requester)},
          requester_telnum = ${this.sqlNullableString(normalized.requesterTelnum)},
          requester_email = ${this.sqlNullableString(normalized.requesterEmail)},
          writer = ${this.sqlNullableString(normalized.writer)},
          note = ${this.sqlNullableString(normalized.note)},
          updated = CURRENT_TIMESTAMP(6)
      WHERE id = ${parsedId}
    `;
    await this.databaseService.runMysqlQuery(updateQuery);

    return {
      id: parsedId,
      message: "기술지원이 수정되었습니다.",
    };
  }

  async deleteSupport(id: string, authContext?: AuthContext) {
    const whereClause = await this.buildDetailWhereClause(id, authContext);
    const support = await this.fetchSupportDetail(whereClause);

    if (!support) {
      throw new NotFoundException("삭제할 기술지원 정보를 찾을 수 없습니다.");
    }

    const parsedId = Number(id);
    const deleteQuery = `
      UPDATE support
      SET removed = CURRENT_TIMESTAMP(6),
          updated = CURRENT_TIMESTAMP(6)
      WHERE id = ${parsedId}
    `;
    await this.databaseService.runMysqlQuery(deleteQuery);

    return {
      id: parsedId,
      message: "기술지원이 삭제되었습니다.",
    };
  }

  private async fetchSupportItems(whereClause: string, limit: number, offset: number) {
    const env = getEnv();
    const query = `
      SELECT COALESCE(
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', result.id,
            'customer_id', result.customer_id,
            'business_id', result.business_id,
            'issued', result.issued,
            'type', result.type,
            'issue', result.issue,
            'solution', result.solution,
            'actioned', result.actioned,
            'action_type', result.action_type,
            'manager', result.manager,
            'status', result.status,
            'requester', result.requester,
            'requester_telnum', result.requester_telnum,
            'requester_email', result.requester_email,
            'writer', result.writer,
            'note', result.note,
            'created', result.created,
            'updated', result.updated,
            'customer_name', result.customer_name,
            'business_name', result.business_name,
            'product_name', result.product_name,
            'product_version', result.product_version
          )
        ),
        JSON_ARRAY()
      ) AS payload
      FROM (
        SELECT
          s.id,
          s.customer_id,
          s.business_id,
          s.issued,
          s.type,
          s.issue,
          s.solution,
          s.actioned,
          s.action_type,
          s.manager,
          s.status,
          s.requester,
          s.requester_telnum,
          s.requester_email,
          s.writer,
          s.note,
          s.created,
          s.updated,
          c.name AS customer_name,
          b.name AS business_name,
          p.name AS product_name,
          p.version AS product_version
        FROM support s
        LEFT JOIN customer c ON s.customer_id = c.id
        LEFT JOIN business b ON s.business_id = b.id
        LEFT JOIN product p ON b.product_id = p.id
        ${whereClause}
        ORDER BY s.created DESC
        LIMIT ${limit} OFFSET ${offset}
      ) result
    `;
    const output = await this.databaseService.runMysqlQuery(query, env.DB_DATABASE);

    return output ? JSON.parse(output) : [];
  }

  private async fetchSupportCount(whereClause: string) {
    const query = `
      SELECT COUNT(*)
      FROM support s
      LEFT JOIN customer c ON s.customer_id = c.id
      LEFT JOIN business b ON s.business_id = b.id
      LEFT JOIN product p ON b.product_id = p.id
      ${whereClause}
    `;
    const output = await this.databaseService.runMysqlQuery(query);

    return Number(output || 0);
  }

  private async fetchSupportDetail(whereClause: string) {
    const query = `
      SELECT JSON_OBJECT(
        'id', s.id,
        'customer_id', s.customer_id,
        'business_id', s.business_id,
        'issued', s.issued,
        'type', s.type,
        'issue', s.issue,
        'solution', s.solution,
        'actioned', s.actioned,
        'action_type', s.action_type,
        'manager', s.manager,
        'status', s.status,
        'requester', s.requester,
        'requester_telnum', s.requester_telnum,
        'requester_email', s.requester_email,
        'writer', s.writer,
        'note', s.note,
        'created', s.created,
        'updated', s.updated,
        'customer_name', c.name,
        'business_name', b.name,
        'product_name', p.name,
        'product_version', p.version
      ) AS payload
      FROM support s
      LEFT JOIN customer c ON s.customer_id = c.id
      LEFT JOIN business b ON s.business_id = b.id
      LEFT JOIN product p ON b.product_id = p.id
      ${whereClause}
      LIMIT 1
    `;
    const output = await this.databaseService.runMysqlQuery(query);

    return output ? JSON.parse(output) : null;
  }

  private async fetchCustomerOptions(authContext?: AuthContext) {
    const conditions = ["removed IS NULL"];

    if (authContext?.role === "user") {
      const scope = await this.fetchUserScope(authContext);

      if (!scope.companyId) {
        return [];
      }

      if (scope.type === "partner") {
        conditions.push(`manager_company_id = ${scope.companyId}`);
      } else if (scope.type === "customer") {
        conditions.push(`id = ${scope.companyId}`);
      } else {
        return [];
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
        FROM customer
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

      if (!scope.companyId) {
        return [];
      }

      if (scope.type === "partner") {
        conditions.push(`c.manager_company_id = ${scope.companyId}`);
      } else if (scope.type === "customer") {
        conditions.push(`b.customer_id = ${scope.companyId}`);
      } else {
        return [];
      }
    }

    const query = `
      SELECT COALESCE(
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', result.id,
            'label', result.label,
            'customerId', result.customer_id
          )
        ),
        JSON_ARRAY()
      ) AS payload
      FROM (
        SELECT
          b.id,
          b.customer_id,
          CONCAT(
            COALESCE(NULLIF(b.name, ''), '-')
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

  private async buildWhereClause(query: SupportQuery, authContext?: AuthContext) {
    const conditions = ["s.removed IS NULL"];
    const searchColumnMap: Record<string, string> = {
      issue: "s.issue",
      solution: "s.solution",
      customer: "c.name",
      business: "b.name",
      requester: "s.requester",
      manager: "s.manager",
      writer: "s.writer",
    };

    await this.appendAccessConditions(conditions, authContext);

    if (query.type && SUPPORT_TYPES.includes(query.type)) {
      conditions.push(`s.type = '${this.databaseService.escapeSqlString(query.type)}'`);
    }

    if (query.status && SUPPORT_STATUSES.includes(query.status)) {
      conditions.push(`s.status = '${this.databaseService.escapeSqlString(query.status)}'`);
    }

    if (query.searchType === "type" && query.keyword && SUPPORT_TYPES.includes(query.keyword)) {
      conditions.push(`s.type = '${this.databaseService.escapeSqlString(query.keyword)}'`);
    } else if (query.searchType === "status" && query.keyword && SUPPORT_STATUSES.includes(query.keyword)) {
      conditions.push(`s.status = '${this.databaseService.escapeSqlString(query.keyword)}'`);
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
    const conditions = ["s.removed IS NULL"];

    if (!Number.isInteger(parsedId) || parsedId < 1) {
      conditions.push("1 = 0");
    } else {
      conditions.push(`s.id = ${parsedId}`);
    }

    await this.appendAccessConditions(conditions, authContext);

    return `WHERE ${conditions.join(" AND ")}`;
  }

  private async normalizeInput(input: SupportInput, authContext?: AuthContext) {
    const customerId = this.parseRequiredPositiveInteger(input.customerId, "고객회사를 선택해주세요.");
    const businessId = this.parseNullablePositiveInteger(input.businessId, "유효한 사업을 선택해주세요.");
    const issued = this.normalizeRequiredDate(String(input.issued || ""), "접수일을 입력해주세요.");
    const actioned = this.normalizeOptionalDate(String(input.actioned || ""));
    const type = String(input.type || "consult").trim();
    const issue = String(input.issue || "").trim();
    const solution = String(input.solution || "").trim();
    const actionType = String(input.actionType || "phone").trim();
    const manager = String(input.manager || "").trim();
    const status = String(input.status || "processing").trim();
    const requester = String(input.requester || "").trim();
    const requesterTelnum = String(input.requesterTelnum || "").trim();
    const requesterEmail = String(input.requesterEmail || "").trim();
    const writer = String(input.writer || authContext?.preferred_username || "").trim();
    const note = String(input.note || "").trim();

    if (!SUPPORT_TYPES.includes(type)) {
      throw new BadRequestException("유효한 지원 유형을 선택해주세요.");
    }

    if (!issue) {
      throw new BadRequestException("문의내용을 입력해주세요.");
    }

    if (!ACTION_TYPES.includes(actionType)) {
      throw new BadRequestException("유효한 처리 방식을 선택해주세요.");
    }

    if (!SUPPORT_STATUSES.includes(status)) {
      throw new BadRequestException("유효한 상태를 선택해주세요.");
    }

    if (actioned && actioned < issued) {
      throw new BadRequestException("처리일은 접수일보다 빠를 수 없습니다.");
    }

    if (requesterEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requesterEmail)) {
      throw new BadRequestException("요청자 이메일 형식이 올바르지 않습니다.");
    }

    return {
      customerId,
      businessId,
      issued,
      type,
      issue,
      solution,
      actioned,
      actionType,
      manager,
      status,
      requester,
      requesterTelnum,
      requesterEmail,
      writer,
      note,
    };
  }

  private async ensureCustomerAccess(customerId: number, authContext?: AuthContext) {
    const conditions = [`id = ${customerId}`, "removed IS NULL"];

    if (authContext?.role === "user") {
      const scope = await this.fetchUserScope(authContext);

      if (!scope.companyId) {
        throw new BadRequestException("고객회사 선택 권한이 없습니다.");
      }

      if (scope.type === "partner") {
        conditions.push(`manager_company_id = ${scope.companyId}`);
      } else if (scope.type === "customer" && scope.companyId !== customerId) {
        throw new BadRequestException("고객회사 선택 권한이 없습니다.");
      } else if (scope.type !== "customer") {
        throw new BadRequestException("고객회사 선택 권한이 없습니다.");
      }
    }

    const output = await this.databaseService.runMysqlQuery(`
      SELECT id
      FROM customer
      WHERE ${conditions.join(" AND ")}
      LIMIT 1
    `);

    if (!output) {
      throw new BadRequestException("고객회사를 찾을 수 없습니다.");
    }
  }

  private async ensureBusinessMatchesCustomer(businessId: number, customerId: number, authContext?: AuthContext) {
    const conditions = [
      `b.id = ${businessId}`,
      `b.customer_id = ${customerId}`,
      "b.removed IS NULL",
    ];

    if (authContext?.role === "user") {
      const scope = await this.fetchUserScope(authContext);

      if (!scope.companyId) {
        conditions.push("1 = 0");
      } else if (scope.type === "partner") {
        conditions.push(`c.manager_company_id = ${scope.companyId}`);
      } else if (scope.type === "customer" && scope.companyId !== customerId) {
        conditions.push("1 = 0");
      } else if (scope.type !== "customer") {
        conditions.push("1 = 0");
      }
    }

    const output = await this.databaseService.runMysqlQuery(`
      SELECT b.id
      FROM business b
      LEFT JOIN customer c ON b.customer_id = c.id AND c.removed IS NULL
      WHERE ${conditions.join(" AND ")}
      LIMIT 1
    `);

    if (!output) {
      throw new BadRequestException("선택한 사업이 고객회사와 일치하지 않습니다.");
    }
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

  private normalizeCompanyId(value: string) {
    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed < 1) {
      return 0;
    }

    return parsed;
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
      conditions.push(`
        EXISTS (
          SELECT 1
          FROM customer customer_scope
          WHERE customer_scope.id = COALESCE(s.customer_id, b.customer_id)
            AND customer_scope.manager_company_id = ${scope.companyId}
        )
      `);
      return;
    }

    if (scope.type === "customer") {
      conditions.push(`(s.customer_id = ${scope.companyId} OR b.customer_id = ${scope.companyId})`);
      return;
    }

    conditions.push("1 = 0");
  }

  private async fetchUserScope(authContext?: AuthContext): Promise<UserScope> {
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

  private normalizeRequiredDate(value: string, message: string) {
    if (!value) {
      throw new BadRequestException(message);
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new BadRequestException("날짜 형식이 올바르지 않습니다.");
    }

    return value;
  }

  private normalizeOptionalDate(value: string) {
    if (!value) {
      return "";
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new BadRequestException("날짜 형식이 올바르지 않습니다.");
    }

    return value;
  }

  private sqlNullableString(value: string) {
    if (!value) {
      return "NULL";
    }

    return `'${this.databaseService.escapeSqlString(value)}'`;
  }

  private mapSupportType(type?: string) {
    const typeMap: Record<string, string> = {
      poc: "PoC",
      consult: "컨설팅",
      technical: "기술지원",
      other: "기타",
      incident: "장애",
    };

    if (!type) {
      return "-";
    }

    return typeMap[type] || type;
  }

  private mapActionType(actionType?: string) {
    const actionTypeMap: Record<string, string> = {
      mail: "메일",
      remote: "원격",
      phone: "전화",
      site: "방문",
    };

    if (!actionType) {
      return "-";
    }

    return actionTypeMap[actionType] || actionType;
  }

  private mapSupportStatus(status?: string) {
    const statusMap: Record<string, string> = {
      processing: "처리 중",
      complete: "완료",
    };

    if (!status) {
      return "-";
    }

    return statusMap[status] || status;
  }
}
