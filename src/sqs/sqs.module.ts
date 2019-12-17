import { Module } from '@nestjs/common';
import { SqsService } from './sqs.service';
import { WechatyModule } from '../wechaty/wechaty.module';
import { MongooseModule } from '@nestjs/mongoose';
import { WechatySchema } from 'wechaty/schemas/wechaty.schema';

@Module({
  imports: [
    WechatyModule,
    MongooseModule.forFeature([{name: 'wechaty', schema: WechatySchema}]),
  ],
  providers: [SqsService],
})
export class SqsModule {}
