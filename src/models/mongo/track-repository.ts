import { IUserModel } from './user-repository';
import { BaseFormatter } from '../../util/base-formatter';
import mongoose, { Schema } from 'mongoose';
import { BaseRepository } from '../shared/base-repository';
import { MongoConnector } from '../../shared/mongo-connector';
import { Inject, Singleton } from 'typescript-ioc';
import { cleanQuery } from '../../util/general-util';

export interface ITrackModel {
    device: 'desktop' | 'mobile' | 'bot' | 'unknown';
    browser: string;
    platform: string;
    user: IUserModel;
    ip: string;
    id?: string;
}

export class TrackFormatter extends BaseFormatter implements ITrackModel {
    browser: string;
    device: 'desktop' | 'mobile' | 'bot';
    ip: string;
    platform: string;
    user: IUserModel;
    id: string;
    constructor(args: any) {
        super();
        this.format(args);
    }
}

@Singleton
export class TrackRepository extends BaseRepository<ITrackModel> {
    protected modelName = 'track';
    protected schema: Schema = new Schema(
        {
            browser: { type: String, required: true },
            device: {
                type: String,
                required: true,
                enum: ['desktop', 'mobile', 'bot', 'unknown']
            },
            platform: { type: String, required: true },
            ip: { type: String, required: true },
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'users' }
        },
        { collection: this.modelName, timestamps: true }
    );

    protected formatter = TrackFormatter;
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

    public async findAndPopulate(skip = 0, limit = 250, sort: string, query: any): Promise<TrackFormatter[]> {
        const sortObject = cleanQuery(sort, this.sortQueryFormatter);
        return (
            await this.documentModel
            .find(this.cleanWhereQuery(query))
            .sort(Object.keys(sortObject).map((key) => [key, sortObject[key]]))
            .skip(skip)
            .limit(limit)
            .populate({
                path: 'user',
                select: 'name username _id rollNo role'
            })
        ).map((item) => new this.formatter(item));
    }
}
