import {ProvideSingleton} from '../../shared/provide-singleton';
import {inject} from 'inversify';
import {MongoConnector} from '../../shared/mongo-connector';
import {Document, Schema} from 'mongoose';
import {BaseRepository} from '../shared/base-repository';
import {BaseFormatter} from '../../util/base-formatter';
import mongoose from 'mongoose';
import {BatchFormatter, IBatchModel} from './batch-repository';
import {ElectiveFormatter, IElectiveModel} from './elective-repository';
import {scopes} from '../types';
import {ApiError} from '../../shared/error-handler';
import constants from '../../constants';

export interface IUserModel {
	id?: string;
	name: string;
	username: string;
	password: string;
	rollNo: string;
	role: 'admin' | 'teacher' | 'student';
	batch ?: IBatchModel;
	electives ?: IElectiveModel[];
}

export class UserFormatter extends BaseFormatter implements IUserModel {
	name: string;
	username: string;
	password: string;
	role: 'admin' | 'teacher' | 'student';
	rollNo: string;
	batch ?: IBatchModel;
	electives ?: IElectiveModel[];
	id: string;
	constructor(args: any) {
		super();
		this.format(args);
		if (this.batch) {
			this.batch = new BatchFormatter(args.batch);
		}
		if (this.electives) {
			for (const [i, v] of args.electives.entries()) {
				this.electives[i] = new ElectiveFormatter(v);
			}
		}
	}
}

export interface SafeUser {
	name: string;
	username: string;
	role: 'admin' | 'teacher' | 'student';
	rollNo: string;
	batch ?: IBatchModel;
	electives ?: IElectiveModel[];
	id: string;
}

const safeAdminRemover = ['password', 'electives'];
const safeTeacherRemover = ['password'];
const safeStudentRemover = ['password'];

export function getSafeUserOmit(role: scopes) {
	switch (role) {
		case 'teacher': {
			return safeTeacherRemover;
		}
		case 'student': {
			return safeStudentRemover;
		}
		case 'admin': {
			return safeAdminRemover
		}
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

	public async getPopulated(id: string, role: scopes) {
		switch (role) {
			case 'admin': {
				// @ts-ignore
				const document: Document = await this.documentModel.findOne({ _id: mongoose.Types.ObjectId(id) });
				if (!document) throw new ApiError(constants.errorTypes.notFound);
				return new this.formatter(document);
			}
			case 'teacher':
			case 'student': {
				// @ts-ignore
				const document: Document = await this.documentModel.findOne({ _id: mongoose.Types.ObjectId(id) }).populate('batch').populate('electives');
				if (!document) throw new ApiError(constants.errorTypes.notFound);
				return new this.formatter(document);
			}
		}
	}
}
