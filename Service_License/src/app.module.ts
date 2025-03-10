import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LicenseModule } from './license/license.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: '10.10.254.208',
      port: 3306,
      username: 'user',
      password: 'Ablecloud1!',
      database: 'licenses',
      entities: [__dirname + '/**/*.entity.{js,ts}'],
      synchronize: true,
      extra: {
        allowPublicKeyRetrieval: true,
      },
    }),
    LicenseModule,
  ],
})
export class AppModule {}
