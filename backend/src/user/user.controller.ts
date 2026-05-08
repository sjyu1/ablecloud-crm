import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { UserService } from "./user.service";

@Controller("users")
@UseGuards(AuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  getUsers(
    @Query("searchType") searchType?: string,
    @Query("keyword") keyword?: string,
    @Query("type") type?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Req() request?: { decodedData?: Record<string, any> }
  ) {
    return this.userService.getUsers({
      searchType,
      keyword,
      type,
      page,
      limit,
    }, request?.decodedData);
  }

  @Get("meta/options")
  getUserFormOptions(@Req() request?: { decodedData?: Record<string, any> }) {
    return this.userService.getUserFormOptions(request?.decodedData);
  }

  @Post()
  createUser(
    @Body() body?: Record<string, any>,
    @Req() request?: { decodedData?: Record<string, any> }
  ) {
    return this.userService.createUser(body || {}, request?.decodedData);
  }

  @Get(":id")
  getUserDetail(@Param("id") id: string) {
    return this.userService.getUserDetail(id);
  }

  @Patch(":id")
  updateUser(
    @Param("id") id: string,
    @Body() body?: Record<string, any>
  ) {
    return this.userService.updateUser(id, body || {});
  }

  @Post(":id/password")
  updateUserPassword(
    @Param("id") id: string,
    @Body() body?: Record<string, any>
  ) {
    return this.userService.updateUserPassword(id, body || {});
  }

  @Delete(":id")
  deleteUser(@Param("id") id: string) {
    return this.userService.deleteUser(id);
  }
}
