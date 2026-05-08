import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { getEnv } from "../env";
import { DatabaseService } from "../database/database.service";
import { UserService } from "../user/user.service";
import * as nodemailer from "nodemailer";

type NoticeQuery = {
  searchType?: string;
  keyword?: string;
  page?: string;
  limit?: string;
};

type NoticeInput = {
  title?: string;
  content?: string;
  writer?: string;
  level?: string | string[];
};

type AuthContext = {
  userId?: string;
  role?: string;
  preferred_username?: string;
};

const NOTICE_LEVELS = ["PLATINUM", "GOLD", "SILVER", "VAR"];

@Injectable()
export class NoticeService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly userService: UserService
  ) {}

  async getNotices(query: NoticeQuery, authContext?: AuthContext) {
    const page = Math.max(Number(query.page || 1), 1);
    const limit = Math.min(Math.max(Number(query.limit || 10), 1), 100);
    const offset = (page - 1) * limit;
    const whereClause = await this.buildWhereClause(query, authContext);
    const items = await this.fetchNoticeItems(whereClause, limit, offset);
    const total = await this.fetchNoticeCount(whereClause);

    return {
      items: items.map((item: any) => ({
        id: item.id,
        title: item.title || "-",
        content: item.content || "",
        writer: item.writer || authContext?.preferred_username || "-",
        level: item.level || "-",
        createdAt: item.created || "-",
        updatedAt: item.updated || "-",
      })),
      pagination: {
        page,
        limit,
        total,
      },
    };
  }

  async getNoticeDetail(id: string, authContext?: AuthContext) {
    const parsedId = Number(id);

    if (!Number.isInteger(parsedId) || parsedId < 1) {
      throw new NotFoundException("공지사항 정보를 찾을 수 없습니다.");
    }

    const item = await this.fetchNoticeDetail(parsedId);

    if (!item) {
      throw new NotFoundException("공지사항 정보를 찾을 수 없습니다.");
    }

    if (!(await this.canReadNoticeLevel(item.level, authContext))) {
      throw new NotFoundException("공지사항 정보를 찾을 수 없습니다.");
    }

    return {
      id: item.id,
      title: item.title || "",
      content: item.content || "",
      writer: item.writer || "",
      level: item.level || "",
      createdAt: item.created || "-",
      updatedAt: item.updated || "-",
    };
  }

  async createNotice(input: NoticeInput, authContext?: AuthContext) {
    const normalized = this.normalizeInput(input, {
      writer: authContext?.preferred_username || "",
    });
    const insertQuery = `
      INSERT INTO notice (
        title,
        content,
        writer,
        level
      ) VALUES (
        '${this.databaseService.escapeSqlString(normalized.title)}',
        '${this.databaseService.escapeSqlString(normalized.content)}',
        ${this.sqlNullableString(normalized.writer)},
        ${this.sqlNullableString(normalized.level)}
      );
      SELECT LAST_INSERT_ID();
    `;
    const createdId = Number(await this.databaseService.runMysqlQuery(insertQuery));

    return {
      id: createdId,
      message: "공지사항이 등록되었습니다.",
    };
  }

  async updateNotice(id: string, input: NoticeInput, authContext?: AuthContext) {
    const parsedId = Number(id);

    if (!Number.isInteger(parsedId) || parsedId < 1) {
      throw new BadRequestException("유효한 공지사항 정보가 아닙니다.");
    }

    const notice = await this.fetchNoticeDetail(parsedId);

    if (!notice) {
      throw new NotFoundException("수정할 공지사항 정보를 찾을 수 없습니다.");
    }

    const normalized = this.normalizeInput(input, {
      writer: notice.writer || authContext?.preferred_username || "",
    });
    const updateQuery = `
      UPDATE notice
      SET title = '${this.databaseService.escapeSqlString(normalized.title)}',
          content = '${this.databaseService.escapeSqlString(normalized.content)}',
          writer = ${this.sqlNullableString(normalized.writer)},
          level = ${this.sqlNullableString(normalized.level)},
          updated = CURRENT_TIMESTAMP(6)
      WHERE id = ${parsedId}
    `;
    await this.databaseService.runMysqlQuery(updateQuery);

    return {
      id: parsedId,
      message: "공지사항이 수정되었습니다.",
    };
  }

  async deleteNotice(id: string) {
    const parsedId = Number(id);

    if (!Number.isInteger(parsedId) || parsedId < 1) {
      throw new BadRequestException("유효한 공지사항 정보가 아닙니다.");
    }

    const notice = await this.fetchNoticeDetail(parsedId);

    if (!notice) {
      throw new NotFoundException("삭제할 공지사항 정보를 찾을 수 없습니다.");
    }

    const deleteQuery = `
      UPDATE notice
      SET removed = CURRENT_TIMESTAMP(6),
          updated = CURRENT_TIMESTAMP(6)
      WHERE id = ${parsedId}
    `;
    await this.databaseService.runMysqlQuery(deleteQuery);

    return {
      id: parsedId,
      message: "공지사항이 삭제되었습니다.",
    };
  }

  async getNoticeMailTargets(id: string, authContext?: AuthContext) {
    const parsedId = Number(id);

    if (!Number.isInteger(parsedId) || parsedId < 1) {
      throw new NotFoundException("공지사항 정보를 찾을 수 없습니다.");
    }

    const notice = await this.fetchNoticeDetail(parsedId);

    if (!notice) {
      throw new NotFoundException("공지사항 정보를 찾을 수 없습니다.");
    }

    if (!(await this.canReadNoticeLevel(notice.level, authContext))) {
      throw new NotFoundException("공지사항 정보를 찾을 수 없습니다.");
    }

    return {
      noticeId: notice.id,
      level: notice.level || "",
      items: await this.fetchNoticeMailTargets(notice.level || ""),
    };
  }

  private async fetchNoticeItems(whereClause: string, limit: number, offset: number) {
    const query = `
      SELECT COALESCE(
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', result.id,
            'title', result.title,
            'content', result.content,
            'writer', result.writer,
            'level', result.level,
            'created', result.created,
            'updated', result.updated
          )
        ),
        JSON_ARRAY()
      ) AS payload
      FROM (
        SELECT
          n.id,
          n.title,
          n.content,
          n.writer,
          n.level,
          n.created,
          n.updated
        FROM notice n
        ${whereClause}
        ORDER BY n.created DESC
        LIMIT ${limit} OFFSET ${offset}
      ) result
    `;
    const output = await this.databaseService.runMysqlQuery(query);

    return output ? JSON.parse(output) : [];
  }

  private async fetchNoticeCount(whereClause: string) {
    const query = `
      SELECT COUNT(*)
      FROM notice n
      ${whereClause}
    `;
    const output = await this.databaseService.runMysqlQuery(query);

    return Number(output || 0);
  }

  private async fetchNoticeDetail(noticeId: number) {
    const query = `
      SELECT JSON_OBJECT(
        'id', n.id,
        'title', n.title,
        'content', n.content,
        'writer', n.writer,
        'level', n.level,
        'created', n.created,
        'updated', n.updated
      ) AS payload
      FROM notice n
      WHERE n.id = ${noticeId}
        AND n.removed IS NULL
      LIMIT 1
    `;
    const output = await this.databaseService.runMysqlQuery(query);

    return output ? JSON.parse(output) : null;
  }

  private async fetchNoticeMailTargets(levelValue: string) {
    const env = getEnv();
    const levels = this.parseNoticeLevels(levelValue);
    const conditions = [
      "(ut.type = 'vendor' OR p.id IS NOT NULL)",
      "u.EMAIL IS NOT NULL",
      "u.EMAIL <> ''",
    ];

    if (!levels.includes("ALL") && levels.length > 0) {
      const escapedLevels = levels
        .map((level) => `'${this.databaseService.escapeSqlString(level)}'`)
        .join(", ");

      conditions.push(`(ut.type = 'vendor' OR UPPER(p.level) IN (${escapedLevels}))`);
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
          AND VALUE IN ('partner', 'vendor')
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
            'phone', result.telnum,
            'partner', result.partner_name,
            'level', result.partner_level,
            'type', result.type
          )
        ),
        JSON_ARRAY()
      ) AS payload
      FROM (
        SELECT
          u.USERNAME AS username,
          u.EMAIL AS email,
          COALESCE(NULLIF(TRIM(COALESCE(u.FIRST_NAME, '')), ''), u.USERNAME, '-') AS name,
          COALESCE(NULLIF(utn.telnum, ''), '-') AS telnum,
          CASE
            WHEN ut.type = 'vendor' THEN 'ABLECLOUD'
            ELSE COALESCE(NULLIF(p.name, ''), '-')
          END AS partner_name,
          CASE
            WHEN ut.type = 'vendor' THEN 'VENDOR'
            ELSE COALESCE(NULLIF(p.level, ''), '-')
          END AS partner_level,
          ut.type
        FROM ${env.DB_DATABASE_USER}.USER_ENTITY u
        INNER JOIN user_company uc ON u.ID = uc.user_id
        INNER JOIN user_type ut ON u.ID = ut.user_id
        LEFT JOIN partner p ON ut.type = 'partner' AND uc.company_id = CAST(p.id AS CHAR) AND p.removed IS NULL
        LEFT JOIN user_telnum utn ON u.ID = utn.user_id
        WHERE ${conditions.join(" AND ")}
        GROUP BY u.ID, u.USERNAME, u.EMAIL, u.FIRST_NAME, utn.telnum, p.name, p.level, ut.type
        ORDER BY
          CASE WHEN ut.type = 'vendor' THEN 0 ELSE 1 END,
          p.level ASC,
          partner_name ASC,
          name ASC,
          u.USERNAME ASC
      ) result
    `;
    const output = await this.databaseService.runMysqlQuery(query);

    return output ? JSON.parse(output) : [];
  }

  private async buildWhereClause(query: NoticeQuery, authContext?: AuthContext) {
    const conditions = ["n.removed IS NULL"];
    const searchColumnMap: Record<string, string> = {
      title: "n.title",
      writer: "n.writer",
      level: "n.level",
    };

    if (authContext?.role === "user") {
      const noticeLevel = await this.fetchUserNoticeLevel(authContext);

      if (!noticeLevel) {
        conditions.push("1 = 0");
      } else {
        conditions.push(this.buildReadableLevelCondition(noticeLevel));
      }
    }

    if (query.keyword && query.searchType && searchColumnMap[query.searchType]) {
      const escapedKeyword = this.databaseService.escapeLike(query.keyword);
      conditions.push(
        `${searchColumnMap[query.searchType]} LIKE '%${escapedKeyword}%' ESCAPE '\\\\'`
      );
    }

    return `WHERE ${conditions.join(" AND ")}`;
  }

  private async canReadNoticeLevel(value: string, authContext?: AuthContext) {
    if (authContext?.role !== "user") {
      return true;
    }

    const noticeLevel = await this.fetchUserNoticeLevel(authContext);

    if (!noticeLevel) {
      return false;
    }

    const levels = this.parseNoticeLevels(value);

    return levels.length === 0 || levels.includes("ALL") || levels.includes(noticeLevel);
  }

  private async fetchUserNoticeLevel(authContext: AuthContext) {
    const companyId = await this.userService.fetchUserCompanyId(authContext.userId || "");

    if (!companyId) {
      return "";
    }

    const escapedCompanyId = this.databaseService.escapeSqlString(String(companyId));
    const query = `
      SELECT level
      FROM partner
      WHERE id = '${escapedCompanyId}'
        AND removed IS NULL
      LIMIT 1
    `;
    const output = await this.databaseService.runMysqlQuery(query);
    const level = String(output || "").trim().toUpperCase();

    return NOTICE_LEVELS.includes(level) ? level : "";
  }

  private buildReadableLevelCondition(level: string) {
    const escapedLevel = this.databaseService.escapeSqlString(level);

    return `(
      n.level IS NULL
      OR n.level = ''
      OR UPPER(n.level) = 'ALL'
      OR FIND_IN_SET('${escapedLevel}', REPLACE(UPPER(n.level), ' ', '')) > 0
    )`;
  }

  private parseNoticeLevels(value: string) {
    return String(value || "")
      .split(",")
      .map((item) => item.trim().toUpperCase())
      .filter(Boolean);
  }

  private normalizeInput(input: NoticeInput, options?: { writer?: string }) {
    const title = String(input.title || "").trim();
    const content = String(input.content || "").trim();
    const writer = String(options?.writer || "").trim();
    const level = this.normalizeLevel(input.level);

    if (!title) {
      throw new BadRequestException("제목을 입력해주세요.");
    }

    if (!content) {
      throw new BadRequestException("내용을 입력해주세요.");
    }

    return {
      title,
      content,
      writer,
      level,
    };
  }

  private normalizeLevel(value: NoticeInput["level"]) {
    const levels = Array.isArray(value)
      ? value.map((item) => String(item || "").trim()).filter(Boolean)
      : String(value || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);

    const uniqueLevels = [...new Set(levels)];

    if (uniqueLevels.includes("ALL")) {
      return "ALL";
    }

    if (NOTICE_LEVELS.every((level) => uniqueLevels.includes(level))) {
      return "ALL";
    }

    return uniqueLevels.join(",");
  }

  private sqlNullableString(value: string) {
    if (!value) {
      return "NULL";
    }

    return `'${this.databaseService.escapeSqlString(value)}'`;
  }

  async sendNoticeMail(id: string, userIds: string[], authContext?: AuthContext) {
    const notice = await this.getNoticeDetail(id, authContext);

    if (!userIds || userIds.length === 0) {
      throw new BadRequestException("메일 대상이 없습니다.");
    }

    const targets = await this.fetchNoticeMailTargets(notice.level || "");

    const users = targets.filter((t: any) => userIds.includes(t.id));

    if (users.length === 0) {
      throw new BadRequestException("유효한 대상이 없습니다.");
    }

    const transporter = nodemailer.createTransport({
      host: "mail.ablecloud.io",
      port: 25,
      secure: false,
    });

    let successCount = 0;

    for (const user of users) {
      if (!user.email) continue;

      try {
        await transporter.sendMail({
          from: "ablecloud@ablecloud.io",
          to: user.email,
          subject: `[ABLECLOUD 공지사항] ${notice.title}`,
          text: notice.content,
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <hr style="border:none; border-top:1px solid #ddd;" />
              <p>${notice.content.replace(/\n/g, "<br>")}</p>
              <hr style="border:none; border-top:1px solid #ddd;" />
              <footer style="margin-top: 20px; font-size: 12px; color: #999;">
                문의사항은 아래 전화 및 메일로 문의바랍니다.<br>
                대표전화 : 1544-3696<br>
                영업 : sales@ablestack.co.kr<br>
                기술지원 : support@ablestack.co.kr
              </footer>
            </div>
          `,
        });

        successCount++;
      } catch (err) {
        console.error(`메일 발송 실패: ${user.email}`, err);
      }
    }

    return {
      message: "메일 발송 완료",
      count: successCount,
    };
  }
}
