import {ProvideSingleton} from '../../shared/provide-singleton';
import {inject} from 'inversify';
import {MongoConnector} from '../../shared/mongo-connector';
import {Schema} from 'mongoose';
import {BaseRepository} from '../shared/base-repository';
import {BaseFormatter} from '../../util/base-formatter';
import * as mongoose from 'mongoose';
import {IBatchModel} from "./batch-repository";
import {IElectiveModel} from "./elective-repository";

export interface IUserModel {
	id?: string;
	name: string;
	username: string;
	password: string;
	role: 'admin' | 'teacher' | 'student';
	batch: IBatchModel;
	electives: IElectiveModel[];
}

export class UserFormatter extends BaseFormatter implements IUserModel {
	name: string;
	username: string;
	password: string;
	role: 'admin' | 'teacher' | 'student';
	batch: IBatchModel;
	electives: IElectiveModel[];
	id: string;
	constructor(args: any) {
		super();
		this.format(args);
	}
}

@ProvideSingleton(UserRepository)
export class UserRepository extends BaseRepository<IUserModel> {
	protected modelName: string = 'users';
	protected schema: Schema = new Schema({
		name: { type: String, required: true },
		username: { type: String, unique: true, required: true },
		password: { type: String, required: true },
		role: { type: String, required: true, enum: ['admin', 'teacher', 'student'] },
		rollNo: { type: String, required: true },
		batch: { type : mongoose.Schema.Types.ObjectId, ref: 'batches' },
		electives: [{ type: mongoose.Schema.Types.ObjectId, ref: 'electives' }]
	}, { collection: this.modelName });

	protected formatter = UserFormatter;
	constructor(@inject(MongoConnector) protected dbConnection: MongoConnector) {
		super();
		super.init();
	}
}
