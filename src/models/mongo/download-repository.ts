import { IUserModel, UserFormatter } from './user-repository';
import { BaseFormatter } from '../../util/base-formatter';
import mongoose, { Schema } from 'mongoose';
import { ClassFormatter, IClassModel } from './class-repository';
import { BatchFormatter, IBatchModel } from './batch-repository';
import { scopes } from '../types';
import { ProvideSingleton } from '../../shared/provide-singleton';
import { BaseRepository } from '../shared/base-repository';
import { inject } from 'inversify';
import { MongoConnector } from '../../shared/mongo-connector';

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
        const items = {
            limitedTo: UserFormatter,
            limitedToBatch: BatchFormatter,
            limitedToClass: ClassFormatter
        };
        if (!(args instanceof mongoose.Types.ObjectId)) {
            this.format(args);
        } else {
            this.id = args.toString();
        }
        for (const v in items) {
            if (args[v]) {
                for (const [i, individualItem] of args[v].entries()) {
                    if (individualItem instanceof mongoose.Types.ObjectId) {
                        // @ts-ignore
                        this[v][i] = v.toString();
                    } else if (typeof v === 'object') {
                        // @ts-ignore
                        this[v][i] = new items[v](individualItem);
                    }
                }
            }
        }
    }
}

@ProvideSingleton(DownloadRespository)
export class DownloadRespository extends BaseRepository<IDownloadModel> {
    protected modelName = 'downloads';
    protected schema: Schema = new Schema(
        {
            fileId: { type: String, required: true },
            path: { type: String, required: true },
            deleteOnAccess: { type: Boolean, required: true },
            shouldTrack: { type: Boolean, required: true },
            limitedBy: { type: String, required: true, enum: ['user', 'class', 'batch', 'role', 'none'] },
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
    constructor(@inject(MongoConnector) protected dbConnection: MongoConnector) {
        super();
        super.init();
    }
}
