import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Config } from '@prisma/client';
import * as argon from 'argon2';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from 'src/prisma/prisma.service';
import { stringToTimespan } from 'src/utils/date.util';
import { parse as yamlParse } from 'yaml';
import { YamlConfig } from '../../prisma/seed/config.seed';
import { CONFIG_FILE as CONFIG_FILE_CONST } from 'src/constants';

@Injectable()
export class ConfigService extends EventEmitter {
  yamlConfig?: YamlConfig;
  logger = new Logger(ConfigService.name);

  constructor(
    @Inject('CONFIG_VARIABLES') private configVariables: Config[],
    private prisma: PrismaService,
  ) {
    super();
  }

  // -----------------------------------
  // Initialization
  // -----------------------------------
  async initialize() {
    await this.loadYamlConfig();

    if (this.yamlConfig) {
      await this.migrateInitUser();
    }
  }

  // -----------------------------------
  // YAML loader with absolute path and safety
  // -----------------------------------
  private async loadYamlConfig() {
    const CONFIG_FILE =
      process.env.CONFIG_FILE ||
      path.resolve(__dirname, '../../config.yaml');

    let configFile = '';
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        configFile = fs.readFileSync(CONFIG_FILE, 'utf8');
        this.logger.log(`Loaded configuration from ${CONFIG_FILE}`);
      } else {
        this.logger.warn(
          `Config file not found at ${CONFIG_FILE}. Falling back to UI configuration.`,
        );
      }
    } catch (e) {
      this.logger.error(`Error reading ${CONFIG_FILE}: ${e.message}`);
    }

    try {
      this.yamlConfig = configFile ? yamlParse(configFile) : {};
      this.logger.debug(
        `Parsed YAML config: ${JSON.stringify(this.yamlConfig, null, 2)}`,
      );

      if (this.yamlConfig) {
        for (const configVariable of this.configVariables) {
          const category = this.yamlConfig[configVariable.category];
          if (!category) continue;
          configVariable.value = category[configVariable.name];
          this.emit('update', configVariable.name, configVariable.value);
        }
      }
    } catch (e) {
      this.logger.error(
        `Failed to parse config.yaml. Falling back to UI configuration: ${e}`,
      );
      this.yamlConfig = {};
    }
  }

  // -----------------------------------
  // Migration of initial admin user
  // -----------------------------------
  private async migrateInitUser(): Promise<void> {
    const initUser = this.yamlConfig?.initUser;

    // Defensive checks so this never throws
    if (!initUser?.enabled) {
      this.logger.log('Initial user migration disabled or missing in config.yaml.');
      return;
    }

    const userCount = await this.prisma.user.count({ where: { isAdmin: true } });
    if (userCount >= 1) {
      this.logger.log('Skip initial user creation. Admin user already exists.');
      return;
    }

    this.logger.log('Creating initial admin user from config.yaml...');
    await this.prisma.user.create({
      data: {
        email: initUser.email,
        username: initUser.username,
        password: initUser.password
          ? await argon.hash(initUser.password)
          : null,
        isAdmin: !!initUser.isAdmin,
      },
    });
  }

  // -----------------------------------
  // Getter helpers
  // -----------------------------------
  get(key: `${string}.${string}`): any {
    const configVariable = this.configVariables.find(
      (v) => `${v.category}.${v.name}` === key,
    );

    if (!configVariable) throw new Error(`Config variable ${key} not found`);

    const value = configVariable.value ?? configVariable.defaultValue;

    if (configVariable.type === 'number' || configVariable.type === 'filesize')
      return parseInt(value);
    if (configVariable.type === 'boolean') return value === 'true';
    if (configVariable.type === 'string' || configVariable.type === 'text')
      return value;
    if (configVariable.type === 'timespan') return stringToTimespan(value);
  }

  async getByCategory(category: string) {
    const configVariables = this.configVariables
      .filter((c) => !c.locked && category === c.category)
      .sort((c) => c.order);

    return configVariables.map((variable) => ({
      ...variable,
      key: `${variable.category}.${variable.name}`,
      value: variable.value ?? variable.defaultValue,
      allowEdit: this.isEditAllowed(),
    }));
  }

  async list() {
    const configVariables = this.configVariables.filter((c) => !c.secret);

    return configVariables.map((variable) => ({
      ...variable,
      key: `${variable.category}.${variable.name}`,
      value: variable.value ?? variable.defaultValue,
    }));
  }

  async updateMany(data: { key: string; value: string | number | boolean }[]) {
    if (!this.isEditAllowed())
      throw new BadRequestException(
        'You are only allowed to update config variables via the config.yaml file',
      );

    const response: Config[] = [];
    for (const variable of data) {
      response.push(await this.update(variable.key, variable.value));
    }
    return response;
  }

  async update(key: string, value: string | number | boolean) {
    if (!this.isEditAllowed())
      throw new BadRequestException(
        'You are only allowed to update config variables via the config.yaml file',
      );

    const [category, name] = key.split('.');
    const configVariable = await this.prisma.config.findUnique({
      where: { name_category: { category, name } },
    });

    if (!configVariable || configVariable.locked)
      throw new NotFoundException('Config variable not found');

    if (value === '') value = null;

    this.validateConfigVariable(key, value);

    const updatedVariable = await this.prisma.config.update({
      where: { name_category: { category, name } },
      data: { value: value === null ? null : value.toString() },
    });

    this.configVariables = await this.prisma.config.findMany();
    this.emit('update', key, value);

    return updatedVariable;
  }

  validateConfigVariable(key: string, value: string | number | boolean) {
    const validations = [
      {
        key: 'share.shareIdLength',
        condition: (v: number) => v >= 2 && v <= 50,
        message: 'Share ID length must be between 2 and 50',
      },
      {
        key: 'share.zipCompressionLevel',
        condition: (v: number) => v >= 0 && v <= 9,
        message: 'Zip compression level must be between 0 and 9',
      },
    ];

    const rule = validations.find((v) => v.key === key);
    if (rule && !rule.condition(value as any)) {
      throw new BadRequestException(rule.message);
    }
  }

  isEditAllowed(): boolean {
    return this.yamlConfig === undefined || this.yamlConfig === null;
  }
}
