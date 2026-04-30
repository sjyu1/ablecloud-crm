import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { normalize, relative, resolve } from "path";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { UserService } from "../user/user.service";

type ProductQuery = {
  searchType?: string;
  keyword?: string;
  page?: string;
  limit?: string;
  includeAll?: string;
};

type AuthContext = {
  userId?: string;
  role?: string;
  preferred_username?: string;
};

type CreateProductInput = {
  name?: string;
  categoryId?: number | string;
  version?: string;
  isoFilePath?: string;
};

type UpdateProductInput = CreateProductInput;

type UpdateProductEnabledInput = {
  enabled?: boolean | string | number;
};

type UpdateProductReleaseNoteInput = {
  contents?: string;
};

const FILE_TYPE_LABELS = {
  addon: "ADDON",
  template: "TEMPLATE",
  patch: "PATCH",
};

@Injectable()
export class ProductService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly userService: UserService
  ) {}

  async getProducts(query: ProductQuery, authContext?: AuthContext) {
    const page = Math.max(Number(query.page || 1), 1);
    const limit = Math.min(Math.max(Number(query.limit || 20), 1), 100);
    const offset = (page - 1) * limit;
    const whereClause = await this.buildWhereClause(query, authContext);
    const items = await this.fetchProductItems(whereClause, limit, offset);
    const total = await this.fetchProductCount(whereClause);

    return {
      items: items.map((item: any) => ({
        id: item.id,
        name: item.name || "-",
        version: item.version || "-",
        createdAt: item.created || "-",
        enabled: Boolean(item.enabled),
        enabledLabel: item.enabled ? "활성화" : "비활성화",
      })),
      pagination: {
        page,
        limit,
        total,
      },
    };
  }

  async getProductFormOptions() {
    const categoryOptions = await this.fetchCategoryOptions();

    return {
      categoryOptions,
    };
  }

  getAddonFiles() {
    return this.getProductFiles("addon");
  }

  getTemplateFiles() {
    return this.getProductFiles("template");
  }

  getPatchFiles() {
    return this.getProductFiles("patch");
  }

  async getProductDetail(id: string) {
    const parsedId = Number(id);

    if (!Number.isInteger(parsedId) || parsedId < 1) {
      throw new NotFoundException("제품 정보를 찾을 수 없습니다.");
    }

    const item = await this.fetchProductDetail(parsedId);
    const categoryOptions = await this.fetchCategoryOptions();

    if (!item) {
      throw new NotFoundException("제품 정보를 찾을 수 없습니다.");
    }

    const downloadFileName = this.extractFileName(item.isoFilePath || "");
    const checksumLabel = [item.checksum || "", downloadFileName || ""]
      .filter(Boolean)
      .join(" ");

    return {
      id: item.id,
      name: item.name || "-",
      categoryId: item.category_id || "",
      category: item.category_name || "-",
      version: item.version || "-",
      enabled: Boolean(item.enabled),
      enabledLabel: item.enabled ? "활성화" : "비활성화",
      isoFilePath: item.isoFilePath || "",
      downloadFileName,
      checksum: item.checksum || "",
      checksumLabel: checksumLabel || "-",
      createdAt: item.created || "-",
      contents: item.contents || "",
      categoryOptions,
    };
  }

  async downloadProductIsoFile(id: string) {
    const parsedId = Number(id);

    if (!Number.isInteger(parsedId) || parsedId < 1) {
      throw new NotFoundException("제품 정보를 찾을 수 없습니다.");
    }

    const product = await this.fetchProductDetail(parsedId);

    if (!product) {
      throw new NotFoundException("제품 정보를 찾을 수 없습니다.");
    }

    const filePath = this.resolveIsoFilePath(product.isoFilePath || "");
    const filename = this.extractFileName(product.isoFilePath || "");

    if (!filename || !existsSync(filePath) || !statSync(filePath).isFile()) {
      throw new NotFoundException("제품 ISO 파일을 찾을 수 없습니다.");
    }

    return {
      filePath,
      filename,
    };
  }

  async downloadAddonFile(filename: string) {
    return this.downloadProductFile("addon", filename);
  }

  async downloadTemplateFile(filename: string) {
    return this.downloadProductFile("template", filename);
  }

  async downloadPatchFile(filename: string) {
    return this.downloadProductFile("patch", filename);
  }

  async createProduct(input: CreateProductInput) {
    const name = String(input.name || "").trim();
    const categoryId = Number(input.categoryId);
    const version = String(input.version || "").trim();
    const isoFilePath = String(input.isoFilePath || "").trim();

    if (!name) {
      throw new BadRequestException("제품명을 입력해주세요.");
    }

    if (!Number.isInteger(categoryId) || categoryId < 1) {
      throw new BadRequestException("제품 카테고리를 선택해주세요.");
    }

    if (!version) {
      throw new BadRequestException("제품버전을 입력해주세요.");
    }

    const checksum = this.readChecksumFile(isoFilePath);
    const escapedName = this.databaseService.escapeSqlString(name);
    const escapedVersion = this.databaseService.escapeSqlString(version);
    const escapedIsoFilePath = this.databaseService.escapeSqlString(isoFilePath);
    const escapedChecksum = this.databaseService.escapeSqlString(checksum);
    const insertQuery = `
      INSERT INTO product (
        category_id,
        name,
        version,
        isoFilePath,
        checksum,
        enabled
      )
      VALUES (
        ${categoryId},
        '${escapedName}',
        '${escapedVersion}',
        '${escapedIsoFilePath}',
        '${escapedChecksum}',
        1
      );
      SELECT LAST_INSERT_ID();
    `;
    const createdId = Number(await this.databaseService.runMysqlQuery(insertQuery));

    return {
      id: createdId,
      message: "제품이 등록되었습니다.",
    };
  }

  async updateProduct(id: string, input: UpdateProductInput) {
    const parsedId = Number(id);

    if (!Number.isInteger(parsedId) || parsedId < 1) {
      throw new BadRequestException("유효한 제품 정보가 아닙니다.");
    }

    const product = await this.fetchProductDetail(parsedId);

    if (!product) {
      throw new NotFoundException("수정할 제품 정보를 찾을 수 없습니다.");
    }

    const name = String(input.name || "").trim();
    const categoryId = Number(input.categoryId);
    const version = String(input.version || "").trim();
    const isoFilePath = String(input.isoFilePath || "").trim();

    if (!name) {
      throw new BadRequestException("제품명을 입력해주세요.");
    }

    if (!Number.isInteger(categoryId) || categoryId < 1) {
      throw new BadRequestException("제품 카테고리를 선택해주세요.");
    }

    if (!version) {
      throw new BadRequestException("제품버전을 입력해주세요.");
    }

    const checksum = this.readChecksumFile(isoFilePath);
    const escapedName = this.databaseService.escapeSqlString(name);
    const escapedVersion = this.databaseService.escapeSqlString(version);
    const escapedIsoFilePath = this.databaseService.escapeSqlString(isoFilePath);
    const escapedChecksum = this.databaseService.escapeSqlString(checksum);
    const updateQuery = `
      UPDATE product
      SET category_id = ${categoryId},
          name = '${escapedName}',
          version = '${escapedVersion}',
          isoFilePath = '${escapedIsoFilePath}',
          checksum = '${escapedChecksum}',
          updated = CURRENT_TIMESTAMP(6)
      WHERE id = ${parsedId}
    `;
    await this.databaseService.runMysqlQuery(updateQuery);

    return {
      id: parsedId,
      message: "제품이 수정되었습니다.",
    };
  }

  async updateProductEnabled(id: string, input: UpdateProductEnabledInput) {
    const parsedId = Number(id);

    if (!Number.isInteger(parsedId) || parsedId < 1) {
      throw new BadRequestException("유효한 제품 정보가 아닙니다.");
    }

    const product = await this.fetchProductDetail(parsedId);

    if (!product) {
      throw new NotFoundException("상태를 변경할 제품 정보를 찾을 수 없습니다.");
    }

    const enabled = this.normalizeEnabledValue(input.enabled);
    const updateQuery = `
      UPDATE product
      SET enabled = ${enabled ? 1 : 0},
          updated = CURRENT_TIMESTAMP(6)
      WHERE id = ${parsedId}
    `;
    await this.databaseService.runMysqlQuery(updateQuery);

    return {
      id: parsedId,
      enabled,
      enabledLabel: enabled ? "활성화" : "비활성화",
      message: enabled ? "제품이 활성화되었습니다." : "제품이 비활성화되었습니다.",
    };
  }

  async updateProductReleaseNote(id: string, input: UpdateProductReleaseNoteInput) {
    const parsedId = Number(id);

    if (!Number.isInteger(parsedId) || parsedId < 1) {
      throw new BadRequestException("유효한 제품 정보가 아닙니다.");
    }

    const product = await this.fetchProductDetail(parsedId);

    if (!product) {
      throw new NotFoundException("릴리즈노트를 수정할 제품 정보를 찾을 수 없습니다.");
    }

    const contents = String(input.contents || "");
    const escapedContents = this.databaseService.escapeSqlString(contents);
    const updateQuery = `
      UPDATE product
      SET contents = '${escapedContents}',
          updated = CURRENT_TIMESTAMP(6)
      WHERE id = ${parsedId}
    `;
    await this.databaseService.runMysqlQuery(updateQuery);

    return {
      id: parsedId,
      message: "릴리즈노트가 저장되었습니다.",
    };
  }

  async deleteProduct(id: string) {
    const parsedId = Number(id);

    if (!Number.isInteger(parsedId) || parsedId < 1) {
      throw new BadRequestException("유효한 제품 정보가 아닙니다.");
    }

    const product = await this.fetchProductDetail(parsedId);

    if (!product) {
      throw new NotFoundException("삭제할 제품 정보를 찾을 수 없습니다.");
    }

    const deleteQuery = `
      UPDATE product
      SET removed = CURRENT_TIMESTAMP(6),
          updated = CURRENT_TIMESTAMP(6)
      WHERE id = ${parsedId}
    `;
    await this.databaseService.runMysqlQuery(deleteQuery);

    return {
      id: parsedId,
      message: "제품이 삭제되었습니다.",
    };
  }

  private async fetchProductItems(whereClause: string, limit: number, offset: number) {
    const query = `
      SELECT COALESCE(
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', result.id,
            'name', result.name,
            'version', result.version,
            'created', result.created,
            'enabled', result.enabled
          )
        ),
        JSON_ARRAY()
      ) AS payload
      FROM (
        SELECT
          p.id,
          p.name,
          p.version,
          p.created,
          p.enabled
        FROM product p
        ${whereClause}
        ORDER BY p.id DESC
        LIMIT ${limit} OFFSET ${offset}
      ) result
    `;
    const output = await this.databaseService.runMysqlQuery(query);

    return output ? JSON.parse(output) : [];
  }

  private async fetchProductDetail(productId: number) {
    const query = `
      SELECT JSON_OBJECT(
        'id', p.id,
        'name', p.name,
        'category_id', p.category_id,
        'version', p.version,
        'enabled', p.enabled,
        'isoFilePath', p.isoFilePath,
        'checksum', p.checksum,
        'contents', p.contents,
        'created', p.created,
        'category_name', pc.name
      ) AS payload
      FROM product p
      LEFT JOIN product_category pc ON p.category_id = pc.id
      WHERE p.id = ${productId}
        AND p.removed IS NULL
      LIMIT 1
    `;
    const output = await this.databaseService.runMysqlQuery(query);

    return output ? JSON.parse(output) : null;
  }

  private async fetchProductCount(whereClause: string) {
    const query = `
      SELECT COUNT(*)
      FROM product p
      ${whereClause}
    `;
    const output = await this.databaseService.runMysqlQuery(query);

    return Number(output || 0);
  }

  private async fetchCategoryOptions() {
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
        FROM product_category
        WHERE removed IS NULL
        ORDER BY name ASC
      ) result
    `;
    const output = await this.databaseService.runMysqlQuery(query);

    return output ? JSON.parse(output) : [];
  }

  private async buildWhereClause(query: ProductQuery, authContext?: AuthContext) {
    const conditions = ["p.removed IS NULL"];

    if (authContext?.role === "user") {
      const companyId = Number(await this.userService.fetchUserCompanyId(authContext.userId || ""));

      if (!Number.isInteger(companyId) || companyId < 1) {
        conditions.push("1 = 0");
      } else {
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
    }

    if (authContext?.role === "user" || query.includeAll !== "true") {
      conditions.push("p.enabled = 1");
    }

    if (query.keyword && query.searchType === "name") {
      const escapedKeyword = this.databaseService.escapeLike(query.keyword);
      conditions.push(`p.name LIKE '%${escapedKeyword}%' ESCAPE '\\\\'`);
    }

    return `WHERE ${conditions.join(" AND ")}`;
  }

  private extractFileName(path: string) {
    if (!path) {
      return "";
    }

    const parts = String(path).split("/");

    return parts[parts.length - 1] || "";
  }

  private readFileEntries(rootPath: string) {
    if (!existsSync(rootPath)) {
      return [];
    }

    return readdirSync(rootPath, { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => {
        const filePath = resolve(rootPath, entry.name);
        const stats = statSync(filePath);
        const extension = entry.name.includes(".")
          ? entry.name.split(".").pop()?.toUpperCase() || "-"
          : "-";

        return {
          name: entry.name,
          type: extension,
          size: stats.size,
          updatedAt: stats.mtime,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  private getProductFiles(type: "addon" | "template" | "patch") {
    return {
      items: this.readFileEntries(resolve(process.cwd(), `files/${type}`)),
    };
  }

  private downloadProductFile(type: "addon" | "template" | "patch", filename: string) {
    const filePath = this.resolveProductFilePath(type, filename);
    const label = FILE_TYPE_LABELS[type];

    if (!existsSync(filePath) || !statSync(filePath).isFile()) {
      throw new NotFoundException(`${label} 파일을 찾을 수 없습니다.`);
    }

    return {
      filePath,
      filename,
    };
  }

  private resolveProductFilePath(type: "addon" | "template" | "patch", filename: string) {
    const normalizedFilename = normalize(String(filename || "")).replace(/^[\\/]+/, "");

    if (!normalizedFilename) {
      throw new BadRequestException("유효한 파일명이 아닙니다.");
    }

    const rootPath = resolve(process.cwd(), `files/${type}`);
    const filePath = resolve(rootPath, normalizedFilename);
    const relativeFilePath = relative(rootPath, filePath);

    if (
      relativeFilePath.startsWith("..") ||
      relativeFilePath === "" ||
      relativeFilePath.includes("/") ||
      relativeFilePath.includes("\\")
    ) {
      throw new BadRequestException("유효한 파일명이 아닙니다.");
    }

    return filePath;
  }

  private resolveIsoFilePath(isoFilePath: string) {
    if (!isoFilePath) {
      throw new BadRequestException("제품 ISO 경로가 없습니다.");
    }

    const isoFilesRoot = resolve(process.cwd(), "files/iso");
    const relativeIsoFilePath = normalize(isoFilePath).replace(/^[\\/]+/, "");
    const filePath = resolve(isoFilesRoot, relativeIsoFilePath);
    const relativeFilePath = relative(isoFilesRoot, filePath);

    if (relativeFilePath.startsWith("..") || relativeFilePath === "") {
      throw new BadRequestException("유효한 ISO 경로가 아닙니다.");
    }

    return filePath;
  }

  private normalizeEnabledValue(value: boolean | string | number | undefined) {
    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "number") {
      if (value === 1) {
        return true;
      }

      if (value === 0) {
        return false;
      }
    }

    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();

      if (["true", "1", "active", "enabled"].includes(normalized)) {
        return true;
      }

      if (["false", "0", "inactive", "disabled"].includes(normalized)) {
        return false;
      }
    }

    throw new BadRequestException("유효한 활성화 상태가 아닙니다.");
  }

  private readChecksumFile(isoFilePath: string) {
    if (!isoFilePath) {
      return "";
    }

    const md5FilePath = `${this.resolveIsoFilePath(isoFilePath)}.md5`;
    const isoFilesRoot = resolve(process.cwd(), "files/iso");
    const relativeMd5FilePath = relative(isoFilesRoot, md5FilePath);

    if (relativeMd5FilePath.startsWith("..") || relativeMd5FilePath === "") {
      throw new BadRequestException("유효한 ISO 경로가 아닙니다.");
    }

    try {
      const checksumText = readFileSync(md5FilePath, "utf8");
      const checksum = checksumText.trim().split(/\s+/)[0] || "";

      if (!checksum) {
        throw new Error("empty checksum");
      }

      return checksum;
    } catch (error) {
      throw new BadRequestException("ISO checksum(.md5) 파일을 읽지 못했습니다.");
    }
  }
}
