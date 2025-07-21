import { Module, OnApplicationShutdown } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessModule } from './business/business.module';
import { CustomerModule } from './customer/customer.module';
import { LicenseModule } from './license/license.module';
import { PartnerModule } from './partner/partner.module';
import { ProductModule } from './product/product.module';
import { UserModule } from './user/user.module';
import { SupportModule } from './support/support.module';
import { CreditModule } from './credit/credit.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        retryAttempts: configService.get('NODE_ENV') === 'prod' ? 10 : 1,
        type: 'mysql',
        host: configService.get('DB_HOST'),
        port: Number(configService.get('DB_PORT')),
        database: configService.get('DB_DATABASE'),
        username: configService.get('DB_USER'),
        password: configService.get('DB_PASSWORD'),
        entities: [__dirname + '/**/*.entity.{js,ts}'],
        synchronize: false,
        // logging: true,
        timezone: 'local',
      }),
    }),
    TypeOrmModule.forRootAsync({
      name: 'keycloak',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        retryAttempts: configService.get('NODE_ENV') === 'prod' ? 10 : 1,
        type: 'mysql',
        host: configService.get('DB_HOST'),
        port: Number(configService.get('DB_PORT')),
        database: configService.get('DB_DATABASE_USER'),
        username: configService.get('DB_USER'),
        password: configService.get('DB_PASSWORD'),
        entities: [__dirname + '/**/*.entity.{js,ts}'],
        synchronize: false,
        // logging: true,
        timezone: 'local',
      }),
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        '.env.local',
      ],
    }),
    BusinessModule, CustomerModule, LicenseModule, PartnerModule, ProductModule, UserModule, SupportModule, CreditModule
  ],
})
export class AppModule implements OnApplicationShutdown {
  constructor(private readonly dataSource: DataSource) {}

  async onApplicationShutdown(signal: string) {
    console.log(`Application shutting down due to signal: ${signal}`);
    if (this.dataSource.isInitialized) {
      await this.dataSource.destroy();
      console.log('TypeORM connection pool closed.');
    }
  }
}