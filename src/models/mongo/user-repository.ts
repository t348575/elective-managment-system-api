import {ProvideSingleton} from '../../shared/provide-singleton';
import {inject} from 'inversify';
import {MongoConnector} from '../../shared/mongo-connector';
import {Document, Schema} from 'mongoose';
import {BaseRepository} from '../shared/base-repository';
import {BaseFormatter} from '../../util/base-formatter';
import * as mongoose from 'mongoose';
import {ApiError} from '../../shared/error-handler';
import constants from '../../constants';

export interface IUserModel {
	id?: string;
	name: string;
	username: string;
	password: string;
}

export class UserFormatter extends BaseFormatter implements IUserModel {
	name: string;
	username: string;
	password: string;
	id: string;
	constructor(args: any) {
		super();
		this.format(args);
	}
}

@ProvideSingleton(UserRepository)
export class UserRepository extends BaseRepository<IUserModel> {
	protected modelName: string = 'admin';
	protected schema: Schema = new Schema({
		name: { type: String, unique: true, required: true },
		username: { type: String, unique: true, required: true },
		password: { type: String, required: true },
	}, { collection: this.modelName });
	protected formatter = UserFormatter;
	constructor(@inject(MongoConnector) protected dbConnection: MongoConnector) {
		super();
		super.init();
	}
}
