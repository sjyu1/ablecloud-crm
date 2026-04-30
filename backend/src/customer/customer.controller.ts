import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { CustomerService } from "./customer.service";

@Controller("customers")
@UseGuards(AuthGuard)
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get()
  getCustomers(
    @Query("searchType") searchType?: string,
    @Query("keyword") keyword?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Req() request?: { decodedData?: Record<string, any> }
  ) {
    return this.customerService.getCustomers({
      searchType,
      keyword,
      page,
      limit,
    }, request?.decodedData);
  }

  @Get(":id")
  getCustomerDetail(@Param("id") id: string) {
    return this.customerService.getCustomerDetail(id);
  }

  @Get("meta/options")
  getCustomerFormOptions(@Req() request?: { decodedData?: Record<string, any> }) {
    return this.customerService.getCustomerFormOptions(request?.decodedData);
  }

  @Post()
  createCustomer(@Body() body?: Record<string, any>) {
    return this.customerService.createCustomer(body || {});
  }

  @Patch(":id")
  updateCustomer(
    @Param("id") id: string,
    @Body() body?: Record<string, any>
  ) {
    return this.customerService.updateCustomer(id, body || {});
  }

  @Delete(":id")
  deleteCustomer(@Param("id") id: string) {
    return this.customerService.deleteCustomer(id);
  }
}
