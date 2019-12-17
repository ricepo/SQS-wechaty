import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigService } from './config/config.service';
import { ConfigModule } from './config/config.module';
import { SqsModule } from './sqs/sqs.module';
import { WechatyModule } from './wechaty/wechaty.module';
import { SlackModule } from './slack/slack.module';

@Module({
  imports: [
     ConfigModule,
     WechatyModule,
     SqsModule,
     SlackModule,
     MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.mongoUrl,
        useNewUrlParser: true,
      }),
      inject: [ConfigService],
    }),
    ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
