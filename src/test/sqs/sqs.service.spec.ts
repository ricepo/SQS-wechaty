import {Test} from '@nestjs/testing';
import {TestingModule} from '@nestjs/testing/testing-module';
import sinon = require ('sinon');
import * as _ from 'lodash';
import { SlackService } from '../../slack/slack.service';
import { SqsService } from '../../sqs/sqs.service';
import { ConfigService} from '../../config/config.service';
import { WechatyService } from '../../wechaty/wechaty.service';
import { WechatyModule } from '../../wechaty/wechaty.module';
import Consumer = require('sqs-consumer');
import { getModelToken } from '@nestjs/mongoose';

jest.mock('sqs-consumer', () => ({
  create: jest.fn().mockReturnValue({on: jest.fn(), start: jest.fn()}),
}));

describe('SlackService', () => {

    let module: TestingModule;
    let service: SqsService;

    beforeEach(async () => {

        module = await Test.createTestingModule({
            components: [
                { provide: WechatyService, useValue: {} },
                { provide: ConfigService, useValue: {} },
                SqsService,
              ],
        }).overrideProvider(getModelToken('wechaty'))
        .useValue({}).compile();

        service = module.get(SqsService);

    });

    describe('start', () => {
      it('start sqs', async () => {

        service.start();

        expect(Consumer.create.mock.calls.length).toBe(1);
      });
    });
  });