import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { AuthGuard } from "../auth/auth.guard";
import { ProductService } from "./product.service";

@Controller("products")
@UseGuards(AuthGuard)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get("meta/options")
  getProductFormOptions() {
    return this.productService.getProductFormOptions();
  }

  @Get("files/addon")
  getAddonFiles() {
    return this.productService.getAddonFiles();
  }

  @Get("files/addon/:filename/download")
  async downloadAddonFile(
    @Param("filename") filename: string,
    @Res() response: Response
  ) {
    const file = await this.productService.downloadAddonFile(filename);

    response.download(file.filePath, file.filename);
  }

  @Get("files/template")
  getTemplateFiles() {
    return this.productService.getTemplateFiles();
  }

  @Get("files/template/:filename/download")
  async downloadTemplateFile(
    @Param("filename") filename: string,
    @Res() response: Response
  ) {
    const file = await this.productService.downloadTemplateFile(filename);

    response.download(file.filePath, file.filename);
  }

  @Get("files/patch")
  getPatchFiles() {
    return this.productService.getPatchFiles();
  }

  @Get("files/patch/:filename/download")
  async downloadPatchFile(
    @Param("filename") filename: string,
    @Res() response: Response
  ) {
    const file = await this.productService.downloadPatchFile(filename);

    response.download(file.filePath, file.filename);
  }

  @Get()
  getProducts(
    @Query("searchType") searchType?: string,
    @Query("keyword") keyword?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("includeAll") includeAll?: string,
    @Req() request?: { decodedData?: Record<string, any> }
  ) {
    return this.productService.getProducts({
      searchType,
      keyword,
      page,
      limit,
      includeAll,
    }, request?.decodedData);
  }

  @Get(":id")
  getProductDetail(@Param("id") id: string) {
    return this.productService.getProductDetail(id);
  }

  @Get(":id/download")
  async downloadProductIsoFile(
    @Param("id") id: string,
    @Res() response: Response
  ) {
    const file = await this.productService.downloadProductIsoFile(id);

    response.download(file.filePath, file.filename);
  }

  @Post()
  createProduct(@Body() body?: Record<string, any>) {
    return this.productService.createProduct(body || {});
  }

  @Patch(":id")
  updateProduct(
    @Param("id") id: string,
    @Body() body?: Record<string, any>
  ) {
    return this.productService.updateProduct(id, body || {});
  }

  @Patch(":id/enabled")
  updateProductEnabled(
    @Param("id") id: string,
    @Body() body?: Record<string, any>
  ) {
    return this.productService.updateProductEnabled(id, body || {});
  }

  @Patch(":id/release-note")
  updateProductReleaseNote(
    @Param("id") id: string,
    @Body() body?: Record<string, any>
  ) {
    return this.productService.updateProductReleaseNote(id, body || {});
  }

  @Delete(":id")
  deleteProduct(@Param("id") id: string) {
    return this.productService.deleteProduct(id);
  }
}
