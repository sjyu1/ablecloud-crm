import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { SupportService } from "./support.service";

@Controller("supports")
@UseGuards(AuthGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get()
  getSupports(
    @Query("searchType") searchType?: string,
    @Query("keyword") keyword?: string,
    @Query("type") type?: string,
    @Query("status") status?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Req() request?: { decodedData?: Record<string, any> }
  ) {
    return this.supportService.getSupports({
      searchType,
      keyword,
      type,
      status,
      page,
      limit,
    }, request?.decodedData);
  }

  @Get("meta/options")
  getSupportFormOptions(@Req() request?: { decodedData?: Record<string, any> }) {
    return this.supportService.getSupportFormOptions(request?.decodedData);
  }

  @Get(":id")
  getSupportDetail(
    @Param("id") id: string,
    @Req() request?: { decodedData?: Record<string, any> }
  ) {
    return this.supportService.getSupportDetail(id, request?.decodedData);
  }

  @Post()
  createSupport(
    @Body() body?: Record<string, any>,
    @Req() request?: { decodedData?: Record<string, any> }
  ) {
    return this.supportService.createSupport(body || {}, request?.decodedData);
  }

  @Patch(":id")
  updateSupport(
    @Param("id") id: string,
    @Body() body?: Record<string, any>,
    @Req() request?: { decodedData?: Record<string, any> }
  ) {
    return this.supportService.updateSupport(id, body || {}, request?.decodedData);
  }

  @Delete(":id")
  deleteSupport(
    @Param("id") id: string,
    @Req() request?: { decodedData?: Record<string, any> }
  ) {
    return this.supportService.deleteSupport(id, request?.decodedData);
  }
}
