import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { PartnerService } from "./partner.service";

@Controller("partners")
@UseGuards(AuthGuard)
export class PartnerController {
  constructor(private readonly partnerService: PartnerService) {}

  @Get()
  getPartners(
    @Query("searchType") searchType?: string,
    @Query("keyword") keyword?: string,
    @Query("level") level?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Req() request?: { decodedData?: Record<string, any> }
  ) {
    return this.partnerService.getPartners({
      searchType,
      keyword,
      level,
      page,
      limit,
    }, request?.decodedData);
  }

  @Get(":id")
  getPartnerDetail(@Param("id") id: string) {
    return this.partnerService.getPartnerDetail(id);
  }

  @Post()
  createPartner(@Body() body?: Record<string, any>) {
    return this.partnerService.createPartner(body || {});
  }

  @Patch(":id")
  updatePartner(
    @Param("id") id: string,
    @Body() body?: Record<string, any>
  ) {
    return this.partnerService.updatePartner(id, body || {});
  }

  @Delete(":id")
  deletePartner(@Param("id") id: string) {
    return this.partnerService.deletePartner(id);
  }
}
