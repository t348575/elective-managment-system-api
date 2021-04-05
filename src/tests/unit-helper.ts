import constants from '../constants';
import { ConfigModel } from '../models/config-model';
import fs from 'fs';
import path from 'path';
import { Logger } from '../shared/logger';
import { MongoMemoryServer } from 'mongodb-memory-server';

export class UnitHelper {
    public server: MongoMemoryServer;
    constructor() {
        const config: ConfigModel = JSON.parse(
            fs.readFileSync(path.join(__dirname, './../../resources/config.json')).toString()
        );
        constants.privateKey = fs.readFileSync(path.resolve(config.privateKey)).toString();
        constants.publicKey = fs.readFileSync(path.resolve(config.publicKey)).toString();
        // @ts-ignore
        constants.environment = process.env.NODE_ENV;
        Logger.init();
    }
    async init(): Promise<void> {
        this.server = new MongoMemoryServer();
        constants.mongoConnectionString = await this.server.getUri();
    }
}
