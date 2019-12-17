import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const WechatyService: any = app.get('WechatyService');

  const SqsService: any = app.get('SqsService');

  const SlackService: any = app.get('SlackService');

  await WechatyService.init();
  
  SqsService.start();

  SlackService.init();


  
  await app.listen(12999);
}
bootstrap();
