import constants from '../constants';
import { Logger } from '../shared/logger';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { setConstants } from '../util/general-util';
import dotenv from 'dotenv';
import path from 'path';
import { PrivateInjectorInit } from '../routes/private-injector-init';
import {Container} from 'typescript-ioc';

dotenv.config({
    path: path.resolve(process.cwd(), process.env.NODE_ENV + '.env')
});
export class UnitHelper {

    public server: MongoMemoryServer;

    constructor() {
        setConstants();
        Logger.init();
    }

    async initMongoMemoryServer(): Promise<void> {
        this.server = new MongoMemoryServer();
        constants.mongoConnectionString = await this.server.getUri();
        Container.get(PrivateInjectorInit);
    }

    async destructor(): Promise<void> {
        await this.server.stop();
    }
}
