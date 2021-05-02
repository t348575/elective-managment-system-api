import { IUserModel } from './user-repository';
import { IElectiveModel } from './elective-repository';
import { IFormModel } from './form-repository';
import { BaseFormatter } from '../../util/base-formatter';
import { BaseRepository } from '../shared/base-repository';
import mongoose, { Schema } from 'mongoose';
import { MongoConnector } from '../../shared/mongo-connector';
import { cleanQuery } from '../../util/general-util';
import { Inject, Singleton } from 'typescript-ioc';

export interface IResponseModel {
    id?: string;
    user: IUserModel;
    responses: IElectiveModel[];
    form: IFormModel;
    time: Date;
}

export class ResponseFormatter extends BaseFormatter implements IResponseModel {
    form: IFormModel;
    responses: IElectiveModel[];
    user: IUserModel;
    time: Date;
    id: string;
    constructor(args: any) {
        super();
        this.format(args);
    }
}

@Singleton
export class ResponseRepository extends BaseRepository<IResponseModel> {
    protected modelName = 'responses';
    protected schema: Schema = new Schema(
        {
            form: { type: mongoose.Schema.Types.ObjectId, ref: 'forms' },
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
            time: { type: Date, required: true },
            responses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'electives' }]
        },
        { collection: this.modelName }
    );

    protected formatter = ResponseFormatter;
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

    public async findAndPopulate(sort: string, query: any, skip = 0, limit = 250): Promise<ResponseFormatter[]> {
        const sortObject = cleanQuery(sort, this.sortQueryFormatter);
        return (
            await this.documentModel
                .find(this.cleanWhereQuery(query))
                .sort(Object.keys(sortObject).map((key) => [key, sortObject[key]]))
                .skip(skip)
                .limit(limit)
                .populate({
                    path: 'user',
                    select: 'name username _id rollNo role classes batch',
                    populate: ['batch']
                })
                .populate('responses')
        ).map((item) => new this.formatter(item));
    }
}
