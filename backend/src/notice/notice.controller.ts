import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { NoticeService } from "./notice.service";

@Controller("notices")
@UseGuards(AuthGuard)
export class NoticeController {
  constructor(private readonly noticeService: NoticeService) {}

  @Get()
  getNotices(
    @Query("searchType") searchType?: string,
    @Query("keyword") keyword?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Req() request?: { decodedData?: Record<string, any> }
  ) {
    return this.noticeService.getNotices({
      searchType,
      keyword,
      page,
      limit,
    }, request?.decodedData);
  }

  @Get(":id")
  getNoticeDetail(
    @Param("id") id: string,
    @Req() request?: { decodedData?: Record<string, any> }
  ) {
    return this.noticeService.getNoticeDetail(id, request?.decodedData);
  }

  @Get(":id/mail-targets")
  getNoticeMailTargets(
    @Param("id") id: string,
    @Req() request?: { decodedData?: Record<string, any> }
  ) {
    return this.noticeService.getNoticeMailTargets(id, request?.decodedData);
  }

  @Post()
  createNotice(
    @Body() body?: Record<string, any>,
    @Req() request?: { decodedData?: Record<string, any> }
  ) {
    return this.noticeService.createNotice(body || {}, request?.decodedData);
  }

  @Patch(":id")
  updateNotice(
    @Param("id") id: string,
    @Body() body?: Record<string, any>,
    @Req() request?: { decodedData?: Record<string, any> }
  ) {
    return this.noticeService.updateNotice(id, body || {}, request?.decodedData);
  }

  @Delete(":id")
  deleteNotice(@Param("id") id: string) {
    return this.noticeService.deleteNotice(id);
  }

  @Post(":id/send-mail")
  sendNoticeMail(
    @Param("id") id: string,
    @Body() body: { userIds: string[] },
    @Req() request?: { decodedData?: Record<string, any> }
  ) {
    return this.noticeService.sendNoticeMail(id, body.userIds, request?.decodedData);
  }
}
