import { IElectiveModel } from './elective-repository';
import { IUserModel } from './user-repository';
import { BaseFormatter } from '../../util/base-formatter';
import { Inject, Singleton } from 'typescript-ioc';
import { BaseRepository } from '../shared/base-repository';
import mongoose, { Schema } from 'mongoose';
import { MongoConnector } from '../../shared/mongo-connector';
import { cleanQuery } from '../../util/general-util';

export class IRequestChangeModel {
    id?: string;
    from: IElectiveModel;
    to: IElectiveModel;
    user: IUserModel;
    requestDate: Date;
}

export class RequestChangeFormatter extends BaseFormatter implements IRequestChangeModel {
    from: IElectiveModel;
    requestDate: Date;
    to: IElectiveModel;
    user: IUserModel;
    id: string;
    constructor(args: any) {
        super();
        this.format(args);
    }
}

@Singleton
export class RequestChangeRepository extends BaseRepository<IRequestChangeModel> {
    protected modelName = 'request-change';
    protected schema = new Schema(
        {
            from: { type: mongoose.Schema.Types.ObjectId, ref: 'electives' },
            to: { type: mongoose.Schema.Types.ObjectId, ref: 'electives' },
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
            requestDate: { type: Date, required: true }
        },
        { collection: this.modelName }
    );
    protected formatter = RequestChangeFormatter;
    @Inject
    protected dbConnection: MongoConnector;
    constructor() {
        super();
        this.init();
    }
    public async findAndPopulate(skip = 0, limit = 250, sort: string, query: any): Promise<RequestChangeFormatter[]> {
        const sortObject = cleanQuery(sort, this.sortQueryFormatter);
        return (
            await this.documentModel
                .find(this.cleanWhereQuery(query))
                .sort(Object.keys(sortObject).map((key) => [key, sortObject[key]]))
                .skip(skip)
                .limit(limit)
                .populate('from')
                .populate('to')
                .populate({
                    path: 'user',
                    select: 'name username _id rollNo role classes'
                })
        ).map((item) => new this.formatter(item));
    }
}
