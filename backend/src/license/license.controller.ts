import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { AuthGuard } from "../auth/auth.guard";
import { LicenseService } from "./license.service";

@Controller("licenses")
@UseGuards(AuthGuard)
export class LicenseController {
  constructor(private readonly licenseService: LicenseService) {}

  @Get()
  getLicenses(
    @Query("searchType") searchType?: string,
    @Query("keyword") keyword?: string,
    @Query("trial") trial?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Req() request?: { decodedData?: Record<string, any> }
  ) {
    return this.licenseService.getLicenses({
      searchType,
      keyword,
      trial,
      page,
      limit,
    }, request?.decodedData);
  }

  @Get(":id")
  getLicenseDetail(
    @Param("id") id: string,
    @Req() request?: { decodedData?: Record<string, any> }
  ) {
    return this.licenseService.getLicenseDetail(id, request?.decodedData);
  }

  @Get(":id/download")
  async downloadLicenseFile(
    @Param("id") id: string,
    @Req() request?: { decodedData?: Record<string, any> },
    @Res() response?: Response
  ) {
    const file = await this.licenseService.downloadLicenseFile(id, request?.decodedData);

    response?.setHeader("Content-Type", "application/octet-stream");
    response?.setHeader("Content-Disposition", `attachment; filename="${file.filename}"`);
    response?.send(file.content);
  }

  @Post()
  createLicense(
    @Body() body?: Record<string, any>,
    @Req() request?: { decodedData?: Record<string, any> }
  ) {
    return this.licenseService.createLicense(body || {}, request?.decodedData);
  }

  @Patch(":id")
  updateLicense(
    @Param("id") id: string,
    @Body() body?: Record<string, any>,
    @Req() request?: { decodedData?: Record<string, any> }
  ) {
    return this.licenseService.updateLicense(id, body || {}, request?.decodedData);
  }

  @Patch(":id/approve")
  approveLicense(
    @Param("id") id: string,
    @Req() request?: { decodedData?: Record<string, any> }
  ) {
    return this.licenseService.approveLicense(id, request?.decodedData);
  }

  @Delete(":id")
  deleteLicense(
    @Param("id") id: string,
    @Req() request?: { decodedData?: Record<string, any> }
  ) {
    return this.licenseService.deleteLicense(id, request?.decodedData);
  }
}
