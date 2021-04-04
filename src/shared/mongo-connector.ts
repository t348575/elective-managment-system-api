import mongoose from 'mongoose';
import { Logger } from './logger';
import constants from '../constants';
import { Singleton } from 'typescript-ioc';

if (constants.environment === 'debug') {
    mongoose.set(constants.environment, Logger.shouldLog);
}

@Singleton
export class MongoConnector {
    public db: mongoose.Connection;
    private connectionString: string;
    constructor() {
        this.connectionString = constants.mongoConnectionString;
        Logger.log(`connecting to ${constants.environment} MongoDb`);
        this.db = mongoose.createConnection(this.connectionString, {
            useNewUrlParser: true,
            useCreateIndex: true,
            useFindAndModify: true
        });
    }
}
