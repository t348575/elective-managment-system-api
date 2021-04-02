import { ProvideSingleton } from '../../shared/provide-singleton';
import { BaseRepository } from '../shared/base-repository';
import mongoose, { Schema } from 'mongoose';
import { inject } from 'inversify';
import { MongoConnector } from '../../shared/mongo-connector';
import { BaseFormatter } from '../../util/base-formatter';

export interface IPasswordResetModel {
    id?: string;
    user: string;
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
    }
}

@ProvideSingleton(PasswordResetRepository)
export class PasswordResetRepository extends BaseRepository<IPasswordResetModel> {
    protected modelName = 'password-reset';
    protected schema: Schema = new Schema(
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'users', index: { unique: true }, required: true },
            code: { type: String, required: true, unique: true },
            expireAt: { type: Date, expires: '2h', default: Date.now }
        },
        { collection: this.modelName }
    );

    protected formatter = PasswordResetFormatter;
    constructor(@inject(MongoConnector) protected dbConnection: MongoConnector) {
        super();
        super.init();
        this.schema.set('toJSON', {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            transform: (doc: any, ret: { id: any; _id: any; __v: any }, options: any) => {
                ret.id = ret._id;
                delete ret._id;
                delete ret.__v;
            }
        });
    }
}
