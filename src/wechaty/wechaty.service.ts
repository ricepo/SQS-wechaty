import * as _ from 'lodash';
import { Injectable} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '../config/config.service';
import { SlackService } from '../slack/slack.service';
import { Wechaty } from 'wechaty';
import { PuppetPadplus } from 'wechaty-puppet-padplus';
import fs = require('fs');
import path = require('path');
import qrTerm = require('qrcode-terminal');
import moment = require('moment');
import axios from 'axios';
const CronJob = require('cron').CronJob;

const { channel } = require('./default.json');

let saveTokenTimer = null;
let keepAliveTimer = null;

const tokenFilePath = path.join(process.cwd(), '/padplus.memory-card.json');

const config = new ConfigService(`.env`);

@Injectable()
export class WechatyService {
  constructor( private readonly SlackService: SlackService,
               @InjectModel('wechaty') private readonly wechatyModel) {}

  /**
   * Save wechat login session
   */
  async saveToken() {

    if (fs.existsSync(tokenFilePath)) {

      const token = fs.readFileSync(path.join(process.cwd(), '/padplus.memory-card.json'));

      await this.upsertToken(token.toString());
    }
  }

  /**
   * wechaty onScan
   */
  async onScan(qrcode, status) {

    const qrcodeImageUrl = [
      'https://api.qrserver.com/v1/create-qr-code/?data=',
      encodeURIComponent(qrcode),
    ].join('');

    const message = `[${status}] ${qrcodeImageUrl}\n<Please use padplus's account>\nScan QR Code above to log in: `;

    /**
     * Send qrcode to slack
     */
    this.SlackService.send({ message, channel });
  }

  /**
   * Wechaty onLogin
   */
  async  onLogin(user) {

    await this.saveToken();
    console.log(`Wechat: ${user} login successfully!`);

    /**
     * Alert login in slack
     */
    const message = `Wechat: ${user} login successfully!`;

    this.SlackService.send({ message, channel });

    /* let login status shown on phone immediately */
    const bot = _.get(global, 'wechat.client');
    
    await bot.say(message);

    /* Save token every 30s */
    saveTokenTimer = setInterval(this.saveToken.bind(this), 30 * 1000);

    /* send msg to myself every 20m */
    keepAliveTimer = setInterval(async () => {

      const message = `now time is ${moment().format('YYYY-MM-DD HH:mm:ss')}`;
      const id = 'RICEPO BOT STATUS';
      await this._spawn({ id, message })
      console.log(`send msg to RICEPO BOT STATUS`)
    }, 20 * 60 * 1000);

    /**
     * send a test msg to all the groups to let web has them
     * - every 4 o'clock (America/Los_Angeles)
     */
    new CronJob('0 0 7 * * *', () => {
      this.notify()
    }, null, true, 'America/Los_Angeles');
  }

  /**
   * Wechaty user logout
   */
  async onLogout(user) {

    console.log(`${user} logout`);

    /* when logout, switch to web to send msg */
    await this.switchToWeb()
    console.log("pad logout, switch to web")

    /**
     * Alert logout in slack
     */
    const message = `${user} logout`;

    await this.SlackService.send({ message, channel });

    process.exit()
  }

  /**
   * Wechaty error
   */
    onError(e) {

    console.error('Bot error:', e);
    process.exit()
  }

  /**
   * clear timer of saving wechaty token
   */
    clearSaveTokenTimer() {

    if (saveTokenTimer) {
      clearInterval(saveTokenTimer);
      saveTokenTimer = null;
    }

    if (keepAliveTimer) {
      clearInterval(keepAliveTimer);
      keepAliveTimer = null;
    }
  }

  /**
   * Find the wx token
   * if exist, write to token file
   */
  async  getWechatyToken() {

    const id = 'padplus_token';
    const data = await this.wechatyModel.find({_id: id});

    if (data[0] && data[0].token) {
      fs.writeFileSync(tokenFilePath, data[0].token);
    }
  }

  /**
   * Setup wechaty
   */
  async setupWechaty() {

    /**
     * Find the wx token
     */
    await this.getWechatyToken();

    const token = config.padPlusToken;

    /* Init PuppetPadplus */
    const  puppet = new PuppetPadplus({
      token,
    })

    /* Init bot with token of PuppetPadplus*/
    const bot = new Wechaty({ 
      name: 'padplus',
      puppet
    });
    
    bot.on('scan',    this.onScan.bind(this))
      .on('login',   this.onLogin.bind(this))
      .on('logout',  this.onLogout.bind(this))
      .on('error',   this.onError.bind(this))
      .start();

    return bot;
  }

  /**
   * Init wechaty client
   */
  async  init() {

    try {

      /* setup wechaty */
      let bot = await this.setupWechaty();

      _.set(global, 'wechat.client', bot);

      /**
       * Setup an interval timer to synchronous wechaty token between multi process every 60s
       */
      setInterval(async () => {

        /* If bot is not login, exit and wait for docker restart  */
        if (!bot.logonoff()) {
          
          /* if not login ,switch to web to send msg */
          await this.switchToWeb()

          console.log("pad is not login within 1 minutes, switch to web")

          console.log("=============> logonoff() is false ,exit <============")

          process.exit()
        }

      }, 60 * 1000);

    } catch (err) {
      
      this.clearSaveTokenTimer();
      console.error('Wechaty error: ', err);
    }

  }

  /**
   * Upsert wechaty token
   */
  async upsertToken(token){

    const data = {};

    const id = 'padplus_token';

    const info = await this.wechatyModel.findOne({_id: id});

    /* Update token if exist */
    if (!_.isEmpty(info)) {
      _.set(data, '$set.updatedAt', moment().toDate());
      _.set(data, '$set.token', token);

      return await this.wechatyModel.updateOne({_id: id}, data);
    }

    /* Create token if not exist */
    const wechayData = new this.wechatyModel({
      _id: id,
      token,
      createdAt: moment().toDate(),
      updatedAt: moment().toDate(),
    });

    return await wechayData.save();
  }

  /**
   * Find contacts and send
   * @param {String} message
   * @param {String} id The wechat alias or name
   */
  async _spawn({ id, message }) {

    /* Get bot client instance */
    const bot = _.get(global, 'wechat.client');

    /* Find contact by alias */
    const contact = await bot.Contact.find({ alias: id }) || await bot.Contact.find({ name: id });

    /* If contact not found, then find contact by name */
    if (contact) {
      await contact.say(message);
    }

    /* If contact is not found, check room instead */
    const room = await bot.Room.find({ topic: id });

    if (room) {
      await room.say(message);
    }
  }

  /**
   * Parse to contacts
   * @param {String} message
   * @param {Array|String} to
   */
  async send({ message, to }) {

    /**
     * If non-production environment, reddirect wechat to test address
     */
    if (config.nodeEnv !== 'production') {
      to = ['test'];
    }

    /* Make sure recipient is an array */
    to = [].concat(to || []);

    /**
     * Do not attempt to send if recipient is empty
     */
    if (_.isEmpty(to)) { return; }

    /* Send message and wait for them to complete */
    const promises = _
      .chain(to)
      .map(id => this._spawn({ id, message }))
      .value();

    const now = moment().format('YYYY-MM-DD HH:mm:ss');

    try {

        await Promise.all(promises);

        console.log(`time : ${now} , send success`);
      } catch (error) {

        console.log(`time : ${now} , send failed`);
        console.log(`wechaty send error ====>  ${error}`);
        throw error;
      }

  }

  /**
   * switch to pad to send msg 
   */
  async switchToWeb(){

    const data = {};

    const id = 'switch';

    const info = await this.wechatyModel.findOne({_id: id});

    /* Update token if exist */
    if (!_.isEmpty(info)) {
      _.set(data, '$set.updatedAt', moment().toDate());
      _.set(data, '$set.type', 'web');

      return await this.wechatyModel.updateOne({_id: id}, data);
    }
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async notify(){

    /* Get bot client instance */
    const bot = _.get(global, 'wechat.client');
    const message = 'Good morning, I’m ready now...';
    const roomList = await bot.Room.findAll();
    const topics = _.map(roomList, v => v.payload.topic)

    console.log('notify topics length ====> ',topics.length)

    for (const id of topics) {

      await this._spawn({ id, message })

      /**
       * Send every two seconds to avoid being restricted
       */
      await this.sleep(2000)
    }
  }
}
