import { IUserModel } from './user-repository';
import { BaseFormatter } from '../../util/base-formatter';
import mongoose, { Schema } from 'mongoose';
import { IClassModel } from './class-repository';
import { IBatchModel } from './batch-repository';
import { scopes } from '../types';
import { BaseRepository } from '../shared/base-repository';
import { MongoConnector } from '../../shared/mongo-connector';
import { provideSingleton } from '../../provide-singleton';
import { inject } from 'inversify';

export interface IDownloadModel {
    id?: string;
    path: string;
    shouldTrack: boolean;
    fileId: string;
    deleteOnAccess: boolean;
    limitedBy: 'user' | 'class' | 'batch' | 'role' | 'none';
    limitedTo: IUserModel[];
    limitedToClass: IClassModel[];
    limitedToBatch: IBatchModel[];
    limitedToRole: scopes;
    trackAccess: {
        user: IUserModel;
        accessTimes: Date[];
    }[];
}

export class DownloadFormatter extends BaseFormatter implements IDownloadModel {
    deleteOnAccess: boolean;
    shouldTrack: boolean;
    path: string;
    limitedBy: 'user' | 'class' | 'batch' | 'role' | 'none';
    limitedTo: IUserModel[];
    limitedToClass: IClassModel[];
    limitedToBatch: IBatchModel[];
    limitedToRole: scopes;
    trackAccess: { user: IUserModel; accessTimes: Date[] }[];
    id: string;
    fileId: string;
    constructor(args: any) {
        super();
        this.format(args);
    }
}

@provideSingleton(DownloadRespository)
export class DownloadRespository extends BaseRepository<IDownloadModel> {
    protected modelName = 'downloads';
    protected schema: Schema = new Schema(
        {
            fileId: { type: String, required: true },
            path: { type: String, required: true },
            deleteOnAccess: { type: Boolean, required: true },
            shouldTrack: { type: Boolean, required: true },
            limitedBy: {
                type: String,
                required: true,
                enum: ['user', 'class', 'batch', 'role', 'none']
            },
            limitedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }],
            limitedToClass: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }],
            limitedToBatch: [{ type: mongoose.Schema.Types.ObjectId, ref: 'batches' }],
            limitedToRole: { type: String, enum: ['student', 'admin', 'teacher'] },
            trackAccess: [
                {
                    user: { type: mongoose.Schema.Types.ObjectId, ref: 'batches' },
                    accessTimes: [{ type: Date, required: true }]
                }
            ]
        },
        { collection: this.modelName }
    );

    protected formatter = DownloadFormatter;
    @inject(MongoConnector) protected dbConnection: MongoConnector;
    constructor() {
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
