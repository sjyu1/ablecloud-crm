import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { CreditService } from "./credit.service";

@Controller("credits")
@UseGuards(AuthGuard)
export class CreditController {
  constructor(private readonly creditService: CreditService) {}

  @Get()
  getCredits(
    @Query("searchType") searchType?: string,
    @Query("keyword") keyword?: string,
    @Query("kind") kind?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Req() request?: { decodedData?: Record<string, any> }
  ) {
    return this.creditService.getCredits({
      searchType,
      keyword,
      kind,
      page,
      limit,
    }, request?.decodedData);
  }

  @Get("meta/options")
  getCreditFormOptions(@Req() request?: { decodedData?: Record<string, any> }) {
    return this.creditService.getCreditFormOptions(request?.decodedData);
  }

  @Get(":id")
  getCreditDetail(
    @Param("id") id: string,
    @Req() request?: { decodedData?: Record<string, any> }
  ) {
    return this.creditService.getCreditDetail(id, request?.decodedData);
  }

  @Post()
  createCredit(
    @Body() body?: Record<string, any>,
    @Req() request?: { decodedData?: Record<string, any> }
  ) {
    return this.creditService.createCredit(body || {}, request?.decodedData);
  }

  @Patch(":id")
  updateCredit(
    @Param("id") id: string,
    @Body() body?: Record<string, any>,
    @Req() request?: { decodedData?: Record<string, any> }
  ) {
    return this.creditService.updateCredit(id, body || {}, request?.decodedData);
  }

  @Delete(":id")
  deleteCredit(
    @Param("id") id: string,
    @Req() request?: { decodedData?: Record<string, any> }
  ) {
    return this.creditService.deleteCredit(id, request?.decodedData);
  }
}
