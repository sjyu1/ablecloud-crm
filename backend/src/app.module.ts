import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthGuard } from "./auth/auth.guard";
import { AuthController } from "./auth/auth.controller";
import { LicenseController } from "./license/license.controller";
import { BusinessController } from "./business/business.controller";
import { ProductController } from "./product/product.controller";
import { PartnerController } from "./partner/partner.controller";
import { CustomerController } from "./customer/customer.controller";
import { UserController } from "./user/user.controller";
import { SupportController } from "./support/support.controller";
import { CreditController } from "./credit/credit.controller";
import { NoticeController } from "./notice/notice.controller";
import { AuthService } from "./auth/auth.service";
import { LicenseService } from "./license/license.service";
import { BusinessService } from "./business/business.service";
import { ProductService } from "./product/product.service";
import { PartnerService } from "./partner/partner.service";
import { CustomerService } from "./customer/customer.service";
import { SupportService } from "./support/support.service";
import { CreditService } from "./credit/credit.service";
import { NoticeService } from "./notice/notice.service";
import { DatabaseService } from "./database/database.service";
import { UserService } from "./user/user.service";

@Module({
  imports: [],
  controllers: [AppController, AuthController, LicenseController, BusinessController, ProductController, PartnerController, CustomerController, UserController, SupportController, CreditController, NoticeController],
  providers: [
    AppService,
    AuthService,
    LicenseService,
    BusinessService,
    ProductService,
    PartnerService,
    CustomerService,
    SupportService,
    CreditService,
    NoticeService,
    DatabaseService,
    UserService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
