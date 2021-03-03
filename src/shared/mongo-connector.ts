import mongoose from 'mongoose';
import {Logger} from './logger';
import constants from '../constants';
import {ProvideSingleton} from './provide-singleton'
mongoose.set(constants.environment, Logger.shouldLog);
@ProvideSingleton(MongoConnector)
export class MongoConnector {
	public db: mongoose.Connection;
	private readonly connectionString: string = constants.mongoConnectionString;
	constructor() {
		Logger.log(`connecting to ${constants.environment} MongoDb`);
		this.db = mongoose.createConnection(this.connectionString, {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: true});
	}
}
