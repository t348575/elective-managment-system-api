import {ProvideSingleton} from '../../shared/provide-singleton';
import {BaseRepository} from '../shared/base-repository';
import {Schema} from 'mongoose';
import {inject} from 'inversify';
import {MongoConnector} from '../../shared/mongo-connector';
import {BaseFormatter} from '../../util/base-formatter';
import mongoose from 'mongoose';
import {IUserModel, UserFormatter} from './user-repository';
import {BatchFormatter} from './batch-repository';

export interface IPasswordResetModel {
    id?: string;
    user: string,
    expireAt?: Date;
    code: string;
}

export class PasswordResetFormatter extends BaseFormatter implements IPasswordResetModel {
    id: string;
    user: string;
    code: string;
    expireAt: Date;
    constructor(args: any) {
        super();
        this.format(args);
        if (this.user) {
            this.user = args.user.toString();
        }
    }
}

@ProvideSingleton(PasswordResetRepository)
export class PasswordResetRepository extends BaseRepository<IPasswordResetModel> {
    protected modelName = 'password-reset';
    protected schema: Schema = new Schema({
        user: { type : mongoose.Schema.Types.ObjectId, ref: 'users', index: { unique: true }, required: true },
        code: { type: String, required: true, unique: true },
        expireAt: { type: Date, expires: '2h', default: Date.now }
    }, { collection: this.modelName });

    protected formatter = PasswordResetFormatter;
    constructor(@inject(MongoConnector) protected dbConnection: MongoConnector) {
        super();
        super.init();
    }
}