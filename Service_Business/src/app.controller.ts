import { Controller, Get, Logger, UseGuards } from '@nestjs/common';
import { AuthGuard } from "./auth/auth.guard";
import { AppService } from './app.service';
import { MessagePattern } from '@nestjs/microservices';

const logger = new Logger('AppController')

@Controller()
@UseGuards(AuthGuard)
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @MessagePattern('sum')
  async sumNumbers(data: Array<number>) {
    logger.log('math microservice recieved a request to sum ' +  data.toString())
    return { result: data.reduce((a, b) => a + b) }
  }
}
