import { IUserModel } from './user-repository';
import { BaseFormatter } from '../../util/base-formatter';
import mongoose, { Document, Schema } from 'mongoose';
import { IClassModel } from './class-repository';
import { BaseRepository } from '../shared/base-repository';
import { MongoConnector } from '../../shared/mongo-connector';
import { Inject, Singleton } from 'typescript-ioc';
import { ApiError } from '../../shared/error-handler';
import constants from '../../constants';

export interface IDownloadModel {
    id?: string;
    path: string;
    shouldTrack: boolean;
    fileId: string;
    deleteOnAccess: boolean;
    limitedBy: 'user' | 'class' | 'none';
    limitedTo: IUserModel[];
    limitedToClass: IClassModel;
    name: string;
    trackAccess: {
        user: IUserModel;
        time: Date;
    }[];
}

export class DownloadFormatter extends BaseFormatter implements IDownloadModel {
    deleteOnAccess: boolean;
    shouldTrack: boolean;
    path: string;
    limitedBy: 'user' | 'class' | 'none';
    limitedTo: IUserModel[];
    limitedToClass: IClassModel;
    trackAccess: { user: IUserModel; time: Date }[];
    name: string;
    id: string;
    fileId: string;
    constructor(args: any) {
        super();
        this.format(args);
    }
}

@Singleton
export class DownloadRepository extends BaseRepository<IDownloadModel> {
    protected modelName = 'downloads';
    protected schema: Schema = new Schema(
        {
            fileId: { type: String, required: true, unique: true },
            path: { type: String, required: true },
            deleteOnAccess: { type: Boolean, required: true },
            shouldTrack: { type: Boolean, required: true },
            name: { type: String, required: true },
            limitedBy: {
                type: String,
                required: true,
                enum: ['user', 'class', 'none']
            },
            limitedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }],
            limitedToClass: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
            trackAccess: [
                {
                    user: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
                    time: { type: Date, required: true }
                }
            ]
        },
        { collection: this.modelName }
    );

    protected formatter = DownloadFormatter;
    @Inject
    protected dbConnection: MongoConnector;
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

    public async addTrack(file: IDownloadModel, userId: string) {
        // @ts-ignore
        const idx = file.trackAccess.findIndex((e) => e.user === userId);
        if (idx === -1) {
            await this.documentModel.findByIdAndUpdate(file.id, {
                $push: {
                    trackAccess: {
                        user: userId,
                        time: new Date().toISOString()
                    }
                }
            });
        }
    }

    public async findAndPopulate(fileId: string): Promise<IDownloadModel> {
        // @ts-ignore
        const document: Document = await this.documentModel.findOne({ fileId }).populate('trackAccess.user');
        if (!document) throw new ApiError(constants.errorTypes.notFound);
        return new this.formatter(document);
    }
}
