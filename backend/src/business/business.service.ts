import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { getEnv } from "../env";
import { DatabaseService } from "../database/database.service";
import { UserService } from "../user/user.service";

type BusinessQuery = {
  searchType?: string;
  keyword?: string;
  page?: string;
  limit?: string;
  available?: string;
};

type UpdateBusinessInput = {
  project?: string;
  managerId?: string;
  customerId?: number | string;
  productId?: number | string;
  nodeCount?: number | string;
  coreCount?: number | string;
  status?: string;
  startDate?: string;
  endDate?: string;
  details?: string;
};

type CreateBusinessInput = UpdateBusinessInput;

type CreateBusinessProductVersionInput = {
  version?: string;
  note?: string;
};

type AuthContext = {
  userId?: string;
  role?: string;
};

@Injectable()
export class BusinessService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly userService: UserService
  ) {}

  async getBusinesses(query: BusinessQuery, authContext?: AuthContext) {
    const page = Math.max(Number(query.page || 1), 1);
    const limit = Math.min(Math.max(Number(query.limit || 20), 1), 100);
    const offset = (page - 1) * limit;
    const whereClause = await this.buildWhereClause(query, authContext);
    const items = await this.fetchBusinessItems(whereClause, limit, offset);
    const total = await this.fetchBusinessCount(whereClause);

    return {
      items: items.map((item: any) => ({
        id: item.id,
        project: item.name || "-",
        manager: item.manager_name
          ? `${item.manager_name} (${item.manager_company || "ABLECLOUD"})`
          : `- (${item.manager_company || "ABLECLOUD"})`,
        customer: item.customer_name || "-",
        status: this.mapBusinessStatus(item.status),
        product: [item.product_name, item.product_version ? `(v${item.product_version})` : ""]
          .filter(Boolean)
          .join(" "),
        startDate: item.issued,
        endDate: item.expired,
      })),
      pagination: {
        page,
        limit,
        total,
      },
    };
  }

  async getBusinessDetail(id: string, authContext?: AuthContext) {
    const whereClause = await this.buildDetailWhereClause(id, authContext);
    const item = await this.fetchBusinessDetail(whereClause);

    if (!item) {
      throw new NotFoundException("사업 정보를 찾을 수 없습니다.");
    }

    const [managerOptions, customerOptions, productOptions, versionHistory] = await Promise.all([
      this.fetchManagerOptions(authContext),
      this.fetchCustomerOptions(authContext),
      this.fetchProductOptions(authContext, { activeOnly: true }),
      this.fetchBusinessProductVersions(Number(item.id)),
    ]);

    return {
      id: item.id,
      project: item.name || "-",
      managerId: item.manager_id || "",
      manager: item.manager_name || "-",
      managerCompany: item.manager_company || "ABLECLOUD",
      customerId: item.customer_id || "",
      customer: item.customer_name || "-",
      productId: item.product_id || "",
      product: [item.product_name, item.product_version ? `(v${item.product_version})` : ""]
        .filter(Boolean)
        .join(" "),
      nodeCount: item.node_cnt ?? "-",
      coreCount: item.core_cnt ?? "-",
      status: this.mapBusinessStatus(item.status),
      startDate: item.issued || "-",
      endDate: item.expired || "-",
      details: item.details || "",
      licenseId: item.license_id || "",
      productCategory: item.product_category_name || "-",
      license: item.license_id
        ? {
            id: item.license_id,
            key: item.license_key || "-",
            status: this.mapLicenseStatus(item.license_status),
            trial: Boolean(item.license_trial),
            startDate: item.license_issued || "-",
            endDate: item.license_expired || "-",
          }
        : null,
      managerOptions,
      customerOptions,
      productOptions,
      versionHistory,
    };
  }

  async getBusinessFormOptions(authContext?: AuthContext) {
    const [managerOptions, customerOptions, productOptions] = await Promise.all([
      this.fetchManagerOptions(authContext),
      this.fetchCustomerOptions(authContext),
      this.fetchProductOptions(authContext, { activeOnly: true }),
    ]);

    return {
      managerOptions,
      customerOptions,
      productOptions,
    };
  }

  async createBusiness(input: CreateBusinessInput, authContext?: AuthContext) {
    const project = String(input.project || "").trim();
    const managerId = String(input.managerId || "").trim();
    const customerId = Number(input.customerId);
    const productId = String(input.productId || "").trim();
    const status = String(input.status || "").trim();
    const startDate = this.normalizeDate(String(input.startDate || ""));
    const endDate = this.normalizeDate(String(input.endDate || ""));
    const nodeCount = Number(input.nodeCount);
    const coreCount = Number(input.coreCount);
    const details = String(input.details || "");
    const start = new Date(`${startDate}T00:00:00Z`);
    const end = new Date(`${endDate}T00:00:00Z`);
    const validStatuses = [
      "standby",
      "meeting",
      "poc",
      "bmt",
      "ordering",
      "proposal",
      "ordersuccess",
      "cancel",
    ];

    if (!project) {
      throw new BadRequestException("사업명을 입력해주세요.");
    }

    if (!managerId) {
      throw new BadRequestException("사업 담당자를 선택해주세요.");
    }

    if (!Number.isInteger(customerId) || customerId < 1) {
      throw new BadRequestException("고객회사를 선택해주세요.");
    }

    if (!productId) {
      throw new BadRequestException("제품을 선택해주세요.");
    }

    if (!validStatuses.includes(status)) {
      throw new BadRequestException("유효한 상태를 선택해주세요.");
    }

    if (!Number.isFinite(nodeCount) || nodeCount < 0) {
      throw new BadRequestException("노드수는 0 이상이어야 합니다.");
    }

    if (!Number.isFinite(coreCount) || coreCount < 0) {
      throw new BadRequestException("코어수는 0 이상이어야 합니다.");
    }

    if (end < start) {
      throw new BadRequestException("사업 종료일은 시작일보다 빠를 수 없습니다.");
    }

    // if (authContext?.role === "user") {
    //   const companyId = await this.userService.fetchUserCompanyId(authContext.userId || "");

    //   if (!companyId || Number(companyId) !== customerId) {
    //     throw new BadRequestException("고객회사 선택 권한이 없습니다.");
    //   }
    // }

    const escapedProject = this.databaseService.escapeSqlString(project);
    const escapedManagerId = this.databaseService.escapeSqlString(managerId);
    const escapedProductId = this.databaseService.escapeSqlString(productId);
    const escapedStatus = this.databaseService.escapeSqlString(status);
    const escapedStartDate = this.databaseService.escapeSqlString(startDate);
    const escapedEndDate = this.databaseService.escapeSqlString(endDate);
    const escapedDetails = this.databaseService.escapeSqlString(details);
    const insertQuery = `
      INSERT INTO business (
        name,
        status,
        customer_id,
        node_cnt,
        core_cnt,
        manager_id,
        product_id,
        issued,
        expired,
        details
      )
      VALUES (
        '${escapedProject}',
        '${escapedStatus}',
        ${customerId},
        ${nodeCount},
        ${coreCount},
        '${escapedManagerId}',
        '${escapedProductId}',
        '${escapedStartDate}',
        '${escapedEndDate}',
        '${escapedDetails}'
      );
      SELECT LAST_INSERT_ID();
    `;
    const createdId = Number(await this.databaseService.runMysqlQuery(insertQuery));

    await this.createBusinessProductVersionSnapshot(createdId, escapedProductId);

    return {
      id: createdId,
      message: "사업이 등록되었습니다.",
    };
  }

  async updateBusiness(id: string, input: UpdateBusinessInput, authContext?: AuthContext) {
    const whereClause = await this.buildDetailWhereClause(id, authContext);
    const item = await this.fetchBusinessDetail(whereClause);

    if (!item) {
      throw new NotFoundException("수정할 사업 정보를 찾을 수 없습니다.");
    }

    const parsedId = Number(id);

    if (!Number.isInteger(parsedId) || parsedId < 1) {
      throw new BadRequestException("유효한 사업 정보가 아닙니다.");
    }

    const project = String(input.project || "").trim();
    const managerId = String(input.managerId || "").trim();
    const customerId = Number(input.customerId);
    const productId = String(input.productId || "").trim();
    const status = String(input.status || "").trim();
    const startDate = this.normalizeDate(String(input.startDate || ""));
    const endDate = this.normalizeDate(String(input.endDate || ""));
    const nodeCount = Number(input.nodeCount);
    const coreCount = Number(input.coreCount);
    const details = String(input.details || "");
    const start = new Date(`${startDate}T00:00:00Z`);
    const end = new Date(`${endDate}T00:00:00Z`);
    const validStatuses = [
      "standby",
      "meeting",
      "poc",
      "bmt",
      "ordering",
      "proposal",
      "ordersuccess",
      "cancel",
    ];

    if (!project) {
      throw new BadRequestException("사업명을 입력해주세요.");
    }

    if (!managerId) {
      throw new BadRequestException("사업 담당자를 선택해주세요.");
    }

    if (!Number.isInteger(customerId) || customerId < 1) {
      throw new BadRequestException("고객회사를 선택해주세요.");
    }

    if (!productId) {
      throw new BadRequestException("제품을 선택해주세요.");
    }

    if (!validStatuses.includes(status)) {
      throw new BadRequestException("유효한 상태를 선택해주세요.");
    }

    if (!Number.isFinite(nodeCount) || nodeCount < 0) {
      throw new BadRequestException("노드수는 0 이상이어야 합니다.");
    }

    if (!Number.isFinite(coreCount) || coreCount < 0) {
      throw new BadRequestException("코어수는 0 이상이어야 합니다.");
    }

    if (end < start) {
      throw new BadRequestException("사업 종료일은 시작일보다 빠를 수 없습니다.");
    }

    const escapedProject = this.databaseService.escapeSqlString(project);
    const escapedManagerId = this.databaseService.escapeSqlString(managerId);
    const escapedProductId = this.databaseService.escapeSqlString(productId);
    const escapedStatus = this.databaseService.escapeSqlString(status);
    const escapedStartDate = this.databaseService.escapeSqlString(startDate);
    const escapedEndDate = this.databaseService.escapeSqlString(endDate);
    const escapedDetails = this.databaseService.escapeSqlString(details);
    const updateQuery = `
      UPDATE business
      SET name = '${escapedProject}',
          customer_id = ${customerId},
          manager_id = '${escapedManagerId}',
          product_id = '${escapedProductId}',
          node_cnt = ${nodeCount},
          core_cnt = ${coreCount},
          status = '${escapedStatus}',
          issued = '${escapedStartDate}',
          expired = '${escapedEndDate}',
          details = '${escapedDetails}',
          updated = CURRENT_TIMESTAMP(6)
      WHERE id = ${parsedId}
    `;
    await this.databaseService.runMysqlQuery(updateQuery);

    if (String(item.product_id || "") !== productId) {
      await this.createBusinessProductVersionSnapshot(parsedId, escapedProductId);
    }

    return {
      id: parsedId,
      message: "사업이 수정되었습니다.",
    };
  }

  async deleteBusiness(id: string, authContext?: AuthContext) {
    const whereClause = await this.buildDetailWhereClause(id, authContext);
    const item = await this.fetchBusinessDetail(whereClause);

    if (!item) {
      throw new NotFoundException("삭제할 사업 정보를 찾을 수 없습니다.");
    }

    const parsedId = Number(id);

    if (item.license_id || (await this.hasBusinessLicense(parsedId))) {
      throw new BadRequestException("사업에 생성된 라이선스를 먼저 삭제하세요.");
    }

    const deleteQuery = `
      UPDATE business
      SET removed = CURRENT_TIMESTAMP(6),
          updated = CURRENT_TIMESTAMP(6)
      WHERE id = ${parsedId}
    `;
    await this.databaseService.runMysqlQuery(deleteQuery);

    return {
      id: parsedId,
      message: "사업이 삭제되었습니다.",
    };
  }

  async addBusinessProductVersion(id: string, input: CreateBusinessProductVersionInput, authContext?: AuthContext) {
    const whereClause = await this.buildDetailWhereClause(id, authContext);
    const item = await this.fetchBusinessDetail(whereClause);

    if (!item) {
      throw new NotFoundException("사업 정보를 찾을 수 없습니다.");
    }

    const businessId = Number(id);

    if (!Number.isInteger(businessId) || businessId < 1) {
      throw new BadRequestException("유효한 사업 정보가 아닙니다.");
    }

    const version = String(input.version || "").trim();
    const note = String(input.note || "");

    if (!version) {
      throw new BadRequestException("제품버전을 입력해주세요.");
    }

    const escapedVersion = this.databaseService.escapeSqlString(version);
    const escapedNote = this.databaseService.escapeSqlString(note);
    const query = `
      INSERT INTO business_product_ver (
        business_id,
        version,
        note
      )
      VALUES (
        ${businessId},
        '${escapedVersion}',
        '${escapedNote}'
      );
      SELECT LAST_INSERT_ID();
    `;
    const createdId = Number(await this.databaseService.runMysqlQuery(query));

    return {
      id: createdId,
      message: "제품버전이 등록되었습니다.",
    };
  }

  async deleteBusinessProductVersion(id: string, versionId: string, authContext?: AuthContext) {
    const whereClause = await this.buildDetailWhereClause(id, authContext);
    const item = await this.fetchBusinessDetail(whereClause);

    if (!item) {
      throw new NotFoundException("사업 정보를 찾을 수 없습니다.");
    }

    const businessId = Number(id);
    const parsedVersionId = Number(versionId);

    if (!Number.isInteger(businessId) || businessId < 1 || !Number.isInteger(parsedVersionId) || parsedVersionId < 1) {
      throw new BadRequestException("유효한 제품버전 정보가 아닙니다.");
    }

    const versionItem = await this.fetchBusinessProductVersion(businessId, parsedVersionId);

    if (!versionItem) {
      throw new NotFoundException("삭제할 제품버전 정보를 찾을 수 없습니다.");
    }

    const query = `
      DELETE FROM business_product_ver
      WHERE id = ${parsedVersionId}
        AND business_id = ${businessId}
    `;
    await this.databaseService.runMysqlQuery(query);

    return {
      id: parsedVersionId,
      message: "제품버전이 삭제되었습니다.",
    };
  }

  private async fetchBusinessItems(whereClause: string, limit: number, offset: number) {
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
            'name', result.name,
            'issued', result.issued,
            'expired', result.expired,
            'license_id', result.license_id,
            'customer_id', result.customer_id,
            'status', result.status,
            'core_cnt', result.core_cnt,
            'node_cnt', result.node_cnt,
            'manager_id', result.manager_id,
            'product_id', result.product_id,
            'details', result.details,
            'created', result.created,
            'customer_name', result.customer_name,
            'product_name', result.product_name,
            'product_version', result.product_version,
            'product_category_name', result.product_category_name,
            'manager_name', result.manager_name,
            'manager_company_id', result.manager_company_id,
            'manager_company', result.manager_company
          )
        ),
        JSON_ARRAY()
      ) AS payload
      FROM (
        SELECT
          b.id,
          b.name,
          b.issued,
          b.expired,
          b.license_id,
          b.customer_id,
          b.status,
          b.core_cnt,
          b.node_cnt,
          b.manager_id,
          b.product_id,
          b.details,
          b.created,
          c.name AS customer_name,
          p.name AS product_name,
          p.version AS product_version,
          pc.name AS product_category_name,
          u.USERNAME AS manager_name,
          CASE
            WHEN ut.type = 'partner' THEN partner.id
            ELSE 0
          END AS manager_company_id,
          CASE
            WHEN ut.type = 'partner' THEN partner.name
            ELSE 'ABLECLOUD'
          END AS manager_company
        FROM business b
        LEFT JOIN customer c ON b.customer_id = c.id
        LEFT JOIN product p ON b.product_id = p.id
        LEFT JOIN product_category pc ON p.category_id = pc.id
        LEFT JOIN ${env.DB_DATABASE_USER}.USER_ENTITY u ON b.manager_id = u.ID
        LEFT JOIN user_company uc ON u.ID = uc.user_id
        LEFT JOIN user_type ut ON u.ID = ut.user_id
        LEFT JOIN partner ON uc.company_id = CAST(partner.id AS CHAR)
        ${whereClause}
        ORDER BY b.created DESC
        LIMIT ${limit} OFFSET ${offset}
      ) result
    `;
    const output = await this.databaseService.runMysqlQuery(query);

    return output ? JSON.parse(output) : [];
  }

  private async fetchBusinessCount(whereClause: string) {
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
      SELECT COUNT(*) AS total
      FROM business b
      LEFT JOIN customer c ON b.customer_id = c.id
      LEFT JOIN product p ON b.product_id = p.id
      LEFT JOIN product_category pc ON p.category_id = pc.id
      LEFT JOIN ${env.DB_DATABASE_USER}.USER_ENTITY u ON b.manager_id = u.ID
      LEFT JOIN user_company uc ON u.ID = uc.user_id
      LEFT JOIN user_type ut ON u.ID = ut.user_id
      LEFT JOIN partner ON uc.company_id = CAST(partner.id AS CHAR)
      ${whereClause}
    `;
    const output = await this.databaseService.runMysqlQuery(query);

    return Number(output || 0);
  }

  private async fetchBusinessDetail(whereClause: string) {
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
      SELECT JSON_OBJECT(
        'id', b.id,
        'name', b.name,
        'issued', b.issued,
        'expired', b.expired,
        'license_id', b.license_id,
        'customer_id', b.customer_id,
        'status', b.status,
        'core_cnt', b.core_cnt,
        'node_cnt', b.node_cnt,
        'manager_id', b.manager_id,
        'product_id', b.product_id,
        'details', b.details,
        'created', b.created,
        'customer_name', c.name,
        'product_name', p.name,
        'product_version', p.version,
        'product_category_name', pc.name,
        'license_key', l.license_key,
        'license_status', l.status,
        'license_trial', l.trial,
        'license_issued', l.issued,
        'license_expired', l.expired,
        'manager_name', u.USERNAME,
        'manager_company_id',
          CASE
            WHEN ut.type = 'partner' THEN partner.id
            ELSE 0
          END,
        'manager_company',
          CASE
            WHEN ut.type = 'partner' THEN partner.name
            ELSE 'ABLECLOUD'
          END
      ) AS payload
      FROM business b
      LEFT JOIN customer c ON b.customer_id = c.id
      LEFT JOIN product p ON b.product_id = p.id
      LEFT JOIN product_category pc ON p.category_id = pc.id
      LEFT JOIN license l ON CAST(b.license_id AS CHAR) = CAST(l.id AS CHAR) AND l.removed IS NULL
      LEFT JOIN ${env.DB_DATABASE_USER}.USER_ENTITY u ON b.manager_id = u.ID
      LEFT JOIN user_company uc ON u.ID = uc.user_id
      LEFT JOIN user_type ut ON u.ID = ut.user_id
      LEFT JOIN partner ON uc.company_id = CAST(partner.id AS CHAR)
      ${whereClause}
      LIMIT 1
    `;
    const output = await this.databaseService.runMysqlQuery(query);

    return output ? JSON.parse(output) : null;
  }

  private async hasBusinessLicense(businessId: number) {
    const query = `
      SELECT COUNT(*)
      FROM license
      WHERE business_id = ${businessId}
        AND removed IS NULL
    `;
    const output = await this.databaseService.runMysqlQuery(query);

    return Number(output || 0) > 0;
  }

  private async createBusinessProductVersionSnapshot(businessId: number, escapedProductId: string) {
    const query = `
      INSERT INTO business_product_ver (
        business_id,
        version
      )
      SELECT
        ${businessId},
        COALESCE(NULLIF(p.version, ''), '-')
      FROM product p
      WHERE CAST(p.id AS CHAR) = '${escapedProductId}'
        AND p.removed IS NULL
      LIMIT 1
    `;
    await this.databaseService.runMysqlQuery(query);
  }

  private async fetchBusinessProductVersions(businessId: number) {
    const query = `
      SELECT COALESCE(
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', result.id,
            'version', result.version,
            'note', result.note
          )
        ),
        JSON_ARRAY()
      ) AS payload
      FROM (
        SELECT id, version, note
        FROM business_product_ver
        WHERE business_id = ${businessId}
        ORDER BY id DESC
      ) result
    `;
    const output = await this.databaseService.runMysqlQuery(query);

    return output ? JSON.parse(output) : [];
  }

  private async fetchBusinessProductVersion(businessId: number, versionId: number) {
    const query = `
      SELECT JSON_OBJECT(
        'id', id,
        'business_id', business_id,
        'version', version,
        'note', note
      ) AS payload
      FROM business_product_ver
      WHERE id = ${versionId}
        AND business_id = ${businessId}
      LIMIT 1
    `;
    const output = await this.databaseService.runMysqlQuery(query);

    return output ? JSON.parse(output) : null;
  }

  private async fetchManagerOptions(authContext?: AuthContext) {
    const env = getEnv();
    const conditions = ["u.USERNAME IS NOT NULL", "uc.company_id IS NOT NULL", "partner.id IS NOT NULL"];

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
            'label', result.label
          )
        ),
        JSON_ARRAY()
      ) AS payload
      FROM (
        SELECT
          u.ID AS id,
          CONCAT(
            COALESCE(u.USERNAME, '-'),
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

  private async fetchCustomerOptions(authContext?: AuthContext) {
    const conditions = ["removed IS NULL"];

    if (authContext?.role === "user") {
      const companyId = this.normalizeCompanyId(
        await this.userService.fetchUserCompanyId(authContext.userId || "")
      );

      if (!companyId) {
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
      ) result
    `;
    const output = await this.databaseService.runMysqlQuery(query);

    return output ? JSON.parse(output) : [];
  }

  private async fetchProductOptions(authContext?: AuthContext, options?: { activeOnly?: boolean }) {
    const conditions = ["p.removed IS NULL"];

    if (authContext?.role === "user") {
      const companyId = this.normalizeCompanyId(
        await this.userService.fetchUserCompanyId(authContext.userId || "")
      );

      if (!companyId) {
        return [];
      }

      conditions.push(`
        EXISTS (
          SELECT 1
          FROM partner partner_scope
          LEFT JOIN product_category pc_scope ON p.category_id = pc_scope.id
          WHERE partner_scope.id = ${companyId}
            AND partner_scope.removed IS NULL
            AND (
              FIND_IN_SET(CAST(p.category_id AS CHAR), REPLACE(COALESCE(partner_scope.product_category, ''), ' ', '')) > 0
              OR LOCATE(CONCAT(',', COALESCE(pc_scope.name, ''), ','), CONCAT(',', COALESCE(partner_scope.product_category, ''), ',')) > 0
          )
        )
      `);
    }

    if (authContext?.role === "user" || options?.activeOnly) {
      conditions.push("p.enabled = 1");
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
          p.id,
          CONCAT(p.name, ' (v', p.version, ')') AS label
        FROM product p
        WHERE ${conditions.join(" AND ")}
        ORDER BY p.name ASC, p.version DESC
      ) result
    `;
    const output = await this.databaseService.runMysqlQuery(query);

    return output ? JSON.parse(output) : [];
  }

  private async buildWhereClause(query: BusinessQuery, authContext?: AuthContext) {
    const conditions = ["b.removed IS NULL"];
    const searchColumnMap: Record<string, string> = {
      business: "b.name",
      managerCompany: `CASE
        WHEN ut.type = 'partner' THEN partner.name
        ELSE 'ABLECLOUD'
      END`,
      customer: "c.name",
    };

    if (authContext?.role === "user") {
      const companyId = this.normalizeCompanyId(
        await this.userService.fetchUserCompanyId(authContext.userId || "")
      );

      if (!companyId) {
        conditions.push("1 = 0");
      } else {
        conditions.push(`uc.company_id = '${companyId}'`);
      }
    }

    if (query.searchType === "status" && query.keyword) {
      conditions.push(`b.status = '${this.databaseService.escapeLike(query.keyword)}'`);
    } else if (query.keyword && query.searchType && searchColumnMap[query.searchType]) {
      const escapedKeyword = this.databaseService.escapeLike(query.keyword);
      conditions.push(
        `${searchColumnMap[query.searchType]} LIKE '%${escapedKeyword}%' ESCAPE '\\\\'`
      );
    }

    if (query.available === "true") {
      conditions.push("b.license_id IS NULL");
    }

    return `WHERE ${conditions.join(" AND ")}`;
  }

  private async buildDetailWhereClause(id: string, authContext?: AuthContext) {
    const parsedId = Number(id);
    const conditions = ["b.removed IS NULL"];

    if (!Number.isInteger(parsedId) || parsedId < 1) {
      conditions.push("1 = 0");
    } else {
      conditions.push(`b.id = ${parsedId}`);
    }

    if (authContext?.role === "user") {
      const companyId = this.normalizeCompanyId(
        await this.userService.fetchUserCompanyId(authContext.userId || "")
      );

      if (!companyId) {
        conditions.push("1 = 0");
      } else {
        conditions.push(`uc.company_id = '${companyId}'`);
      }
    }

    return `WHERE ${conditions.join(" AND ")}`;
  }

  private mapBusinessStatus(status?: string) {
    const statusMap: Record<string, string> = {
      standby: "대기 중",
      meeting: "고객 미팅",
      poc: "PoC",
      bmt: "BMT",
      ordering: "발주",
      proposal: "제안",
      ordersuccess: "수주 성공",
      cancel: "취소",
    };

    if (!status) {
      return "-";
    }

    return statusMap[status] || status;
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

  private mapLicenseStatus(status?: string) {
    if (status === "active") {
      return "활성";
    }

    if (status === "expired") {
      return "만료";
    }

    if (!status) {
      return "-";
    }

    return "비활성";
  }
}
