import mongoose from 'mongoose';
import { Logger } from './logger';
import constants from '../constants';
import { Singleton } from 'typescript-ioc';

@Singleton
export class MongoConnector {
    public readonly db: mongoose.Connection;
    private readonly connectionString: string;
    constructor() {
        if (constants.environment === 'debug') {
            mongoose.set(constants.environment, Logger.shouldLog);
        }
        this.connectionString = constants.mongoConnectionString;
        Logger.log(`connecting to ${constants.environment} MongoDb`);
        this.db = mongoose.createConnection(this.connectionString, {
            useNewUrlParser: true,
            useCreateIndex: true,
            useFindAndModify: true
        });
    }
}
