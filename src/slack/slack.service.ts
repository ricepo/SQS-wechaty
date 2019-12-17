import * as _ from 'lodash';
import { Injectable } from '@nestjs/common';
import { WebClient } from '@slack/client';
import { ConfigService } from '../config/config.service';
const config = new ConfigService(`.env`);

@Injectable()
export class SlackService {
  constructor() {}

    init(){

        const token = config.slackToken;
        
        const slackClient = new WebClient(token);
        _.set(global, 'slack.client', slackClient);

        console.log('init slack client success !');
    }

    async send({ message, tagPeople = [], channel }){
        /* Get slack client */
        const app = _.get(global, 'slack.client');

        const tagList = [].concat(tagPeople);

        /* Get uesrs of slack */
        const userList = await app.users.list();

        /**
         * Generate tag string
         * <@userID>
         */
        const tagStr = _
            .chain(userList.members)
            .filter(m => _.includes(tagList, m.real_name))
            .map(member => member.id)
            .reduce((acc, cur) => `${acc} <@${cur}>`, '')
            .value();

        const content = `${tagStr}\n${message}`;

        /* Send message to slack */
        await app.chat.postMessage({
            channel,
            text: content,
        });
    }
}
