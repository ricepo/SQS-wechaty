import * as _ from 'lodash';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { WechatyService } from '../wechaty/wechaty.service';
import { InjectModel } from '@nestjs/mongoose';
import moment = require('moment');

import AWS = require('aws-sdk');
import Consumer = require('sqs-consumer');
let timer = null;
let isRunning = false;

@Injectable()
export class SqsService {
  constructor(private readonly config: ConfigService,
              private readonly wechaty: WechatyService,
              @InjectModel('wechaty') private readonly wechatyModel
    ) {}

  start() {
    // Set the region
    AWS.config.update({ region: 'us-east-1' });

    const url = this.config.sqsAddress;

    const app = Consumer.create({
      queueUrl: url,
      handleMessage: async (message, done) => {

        try{
          const sentTimestamp = Number(_.get(message,'Attributes.SentTimestamp'));
          const flag = moment().subtract(5, 'minutes').isBefore(sentTimestamp);
          const body = JSON.parse(message.Body);

          /* Get wechat message environment and set receiver */
          if (_.get(body.env !== 'production')) {
            body.to = ['test'];
          }

          /* Only send messages within five minutes */
          if(flag){
            await this.wechaty.send({message: body.message, to: body.to});
          }
          done();
        }catch (error){
          console.log(error);
          done(error);
        }

      },
      attributeNames: ['SentTimestamp'],
    });

    app.on('error', err => {

      console.log('error::', err);
    });

    setInterval(async () => {

      const id = 'switch';

      /* get switch info from mongodb */
      const info = await this.wechatyModel.findOne({_id: id});

      /* create swtich info if not exist  */
      if(!info){

        const wechayData = new this.wechatyModel({
          _id: id,
          type: 'pad',
          createdAt: moment().toDate(),
          updatedAt: moment().toDate(),
        });

        return await wechayData.save();
      }

      /* Get bot client instance */
      const bot = _.get(global, 'wechat.client');

      /* stop sqs if not login */
      if(!bot.logonoff() && isRunning){
        app.stop();
        isRunning = false;
        console.log('sqs server stop !');
        return 
      }

      const {type} = info;
      if(type === 'pad' && !isRunning){
        console.log("type is =========>",type)
        // start sqs
        clock()
      }else if(type !== 'pad' && isRunning ){
        // stop sqs
        app.stop();
        isRunning = false;
        if(timer){
          clearInterval(timer);
          timer = null;
        }
        console.log('sqs server stop !');
      }
      
    },10 * 1000)

    const clock = async function(){

      if(!timer){
        timer = setInterval(async () => {
    
          /* Get bot client instance */
          const bot = _.get(global, 'wechat.client');
          if(bot && bot.logonoff()){
            app.start();
            isRunning = true;
            console.log('sqs server start !');
            clearInterval(timer);
            timer = null;
          }
    
        }, 5 * 1000);
      }
    }
  }
}
