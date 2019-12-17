import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as Joi from 'joi';

export interface EnvConfig {
  [prop: string]: string;
}

export class ConfigService {

  private readonly envConfig: EnvConfig;

  constructor(filePath: string) {
    const config = dotenv.parse(fs.readFileSync(filePath));
    this.envConfig = this.validateInput(config);
  }

  private validateInput(envConfig: EnvConfig): EnvConfig {
    const envVarsSchema: Joi.ObjectSchema = Joi.object({
      SQS_WECHATY_URL: Joi.string(),
      NODE_ENV: Joi.string(),
      QRCODE_IMAGE_URL: Joi.string(),
      MONGO_URI: Joi.string(),
      WECHATY_PADPLUS_TOKEN: Joi.string(),
      SLACK_TOKEN: Joi.string(),
    });

    const { error, value: validatedEnvConfig } = Joi.validate(
      envConfig,
      envVarsSchema,
    );
    if (error) {
      throw new Error(`Config validation error: ${error.message}`);
    }
    return validatedEnvConfig;
  }

  get sqsAddress(): string {
    return this.envConfig.SQS_WECHATY_URL;
  }

  get nodeEnv(): string {
    return this.envConfig.NODE_ENV;
  }

  get qrcodeUrl(): string {
    return this.envConfig.QRCODE_IMAGE_URL;
  }

  get mongoUrl(): string {
    return this.envConfig.MONGO_URI;
  }

  get padPlusToken(): string {
    return this.envConfig.WECHATY_PADPLUS_TOKEN;
  }

  get slackToken(): string {
    return this.envConfig.SLACK_TOKEN;
  }
}
