import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { BusinessService } from "./business.service";

@Controller("businesses")
@UseGuards(AuthGuard)
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Get()
  getBusinesses(
    @Query("searchType") searchType?: string,
    @Query("keyword") keyword?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("available") available?: string,
    @Req() request?: Record<string, any>
  ) {
    return this.businessService.getBusinesses({
      searchType,
      keyword,
      page,
      limit,
      available,
    }, request?.decodedData);
  }

  @Get("meta/options")
  getBusinessFormOptions(@Req() request?: Record<string, any>) {
    return this.businessService.getBusinessFormOptions(request?.decodedData);
  }

  @Get(":id")
  getBusinessDetail(
    @Param("id") id: string,
    @Req() request?: Record<string, any>
  ) {
    return this.businessService.getBusinessDetail(id, request?.decodedData);
  }

  @Post()
  createBusiness(
    @Body() body?: Record<string, any>,
    @Req() request?: Record<string, any>
  ) {
    return this.businessService.createBusiness(body || {}, request?.decodedData);
  }

  @Post(":id/product-versions")
  addBusinessProductVersion(
    @Param("id") id: string,
    @Body() body?: Record<string, any>,
    @Req() request?: Record<string, any>
  ) {
    return this.businessService.addBusinessProductVersion(id, body || {}, request?.decodedData);
  }

  @Delete(":id/product-versions/:versionId")
  deleteBusinessProductVersion(
    @Param("id") id: string,
    @Param("versionId") versionId: string,
    @Req() request?: Record<string, any>
  ) {
    return this.businessService.deleteBusinessProductVersion(id, versionId, request?.decodedData);
  }

  @Patch(":id")
  updateBusiness(
    @Param("id") id: string,
    @Body() body?: Record<string, any>,
    @Req() request?: Record<string, any>
  ) {
    return this.businessService.updateBusiness(id, body || {}, request?.decodedData);
  }

  @Delete(":id")
  deleteBusiness(
    @Param("id") id: string,
    @Req() request?: Record<string, any>
  ) {
    return this.businessService.deleteBusiness(id, request?.decodedData);
  }
}
