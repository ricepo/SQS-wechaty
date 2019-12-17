import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WechatyService } from './wechaty.service';
import { SlackModule } from '../slack/slack.module';

import { WechatySchema } from './schemas/wechaty.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{name: 'wechaty', schema: WechatySchema}]),
    SlackModule,
  ],
  providers: [WechatyService],
  exports: [WechatyService],
})
export class WechatyModule {}
