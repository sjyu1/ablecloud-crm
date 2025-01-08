import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

const logger = new Logger('Main')

const microServiceOptions = {
  transport: Transport.TCP,
  options: {
    host: '10.10.254.23',
    port : 3017
  }
}

async function bootstrap() {

  const app = await NestFactory.createMicroservice(AppModule, microServiceOptions)

  app.listen()
  
}
bootstrap();