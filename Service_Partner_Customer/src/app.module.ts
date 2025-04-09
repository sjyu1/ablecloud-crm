import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PartnerModule } from './partner/partner.module';
import { CustomerModule } from './customer/customer.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

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
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        '.env.local',
      ],
    }),
    PartnerModule,
    CustomerModule,
  ],
})
export class AppModule {}