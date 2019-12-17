import sinon = require ('sinon');
import * as _ from 'lodash';
import { SlackService } from '../../slack/slack.service';

describe('SlackService', () => {

    let slackService: SlackService;

    beforeEach(async () => {

        slackService = new SlackService();

    });

    describe('send', () => {
      it('send slack message', async () => {

        const postMessageStub = sinon.stub();

        const listStub = sinon.stub();

        listStub.returns({
            members: [],
        });

        const slackClient = {
            users: {
                list: listStub,
            },
            chat: {
                postMessage: postMessageStub,
            },
        };

        _.set(global, 'slack.client', slackClient);

        await slackService.send({message: 'test', channel: 'test'});

        expect(postMessageStub.calledOnce).toBe(true);
      });
    });
  });