import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LicenseModule } from './license/license.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: '10.10.254.32',
      port: 3306,
      username: 'nestjs_user',
      password: 'Ablecloud1!',
      database: 'nestjs_db12',
      entities: [__dirname + '/**/*.entity.{js,ts}'],
      synchronize: true,
    }),
    LicenseModule,
  ],
})
export class AppModule {}
