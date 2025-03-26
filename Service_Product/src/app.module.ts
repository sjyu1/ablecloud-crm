import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductModule } from './product/product.module';

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
      synchronize: false,
      logging: ['error', 'query', 'schema'],
      charset: 'utf8mb4',
      timezone: '+09:00',
      extra: {
        connectionLimit: 10,
      },
      ssl: false,
      retryAttempts: 3,
      retryDelay: 3000,
      keepConnectionAlive: true,
      autoLoadEntities: true
    }),
    ProductModule,
  ],
})
export class AppModule {}
