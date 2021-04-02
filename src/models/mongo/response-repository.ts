import { IUserModel } from './user-repository';
import { IElectiveModel } from './elective-repository';
import { IFormModel } from './form-repository';
import { BaseFormatter } from '../../util/base-formatter';
import { ProvideSingleton } from '../../shared/provide-singleton';
import { BaseRepository } from '../shared/base-repository';
import mongoose, { Schema } from 'mongoose';
import { inject } from 'inversify';
import { MongoConnector } from '../../shared/mongo-connector';
import { cleanQuery } from '../../util/general-util';

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

@ProvideSingleton(ResponseRepository)
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

    public findToStream(sort: string, query: any, pipeCsv: any, pipeRes: any): void {
        const sortObject = cleanQuery(sort, this.sortQueryFormatter);
        this.documentModel
            .find(this.cleanWhereQuery(query))
            .sort(Object.keys(sortObject).map((key) => [key, sortObject[key]]))
            .populate('responses')
            .populate({
                path: 'user',
                select: 'name username _id rollNo role classes batch',
                populate: ['batch']
            })
            .cursor()
            .pipe(pipeCsv)
            .pipe(pipeRes);
    }
}
