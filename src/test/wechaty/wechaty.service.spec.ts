import {Test} from '@nestjs/testing';
import {TestingModule} from '@nestjs/testing/testing-module';
import sinon = require ('sinon');
import * as _ from 'lodash';
import { SlackService } from '../../slack/slack.service';
import { WechatyService } from '../../wechaty/wechaty.service';
import { getModelToken } from '@nestjs/mongoose';
import { Wechaty } from 'wechaty';

describe('WechatyService', () => {

    let module: TestingModule;
    let service: WechatyService;

    beforeEach(async () => {

        module = await Test.createTestingModule({
            components: [
                { provide: SlackService, useValue: {} },
                WechatyService,
              ],
        }).overrideProvider(getModelToken('wechaty'))
        .useValue({}).compile();

        service = module.get(WechatyService);

        const bot = new Wechaty({ profile: 'wechat' });

        _.set(global, 'wechat.client', bot);

    });

    describe('send', () => {
      it('send success', async () => {

        const args = {
            message: 'test',
            to: '123',
        };

        service.send(args);
      });

      it('send failed', async () => {

        _.set(global, 'wechat.client', {});

        const args = {
            message: 'test',
            to: '123',
        };

        try {
            await service.send(args);
        } catch (error) {
            expect( error.message).toBe('Cannot read property \'find\' of undefined');
        }

      });
    });
  });