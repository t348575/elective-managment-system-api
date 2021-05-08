import { electiveAttributes } from '../types';
import { IBatchModel } from './batch-repository';
import { IUserModel } from './user-repository';
import { BaseFormatter } from '../../util/base-formatter';
import { BaseRepository } from '../shared/base-repository';
import mongoose, { Schema } from 'mongoose';
import { MongoConnector } from '../../shared/mongo-connector';
import { cleanQuery } from '../../util/general-util';
import { Inject, Singleton } from 'typescript-ioc';

export interface IElectiveModel {
    id?: string;
    name: string;
    description: string;
    courseCode: string;
    version: number;
    strength: number;
    attributes: electiveAttributes;
    batches: IBatchModel[];
    teachers: IUserModel[];
}

export class ElectiveFormatter extends BaseFormatter implements IElectiveModel {
    name: string;
    description: string;
    courseCode: string;
    version: number;
    strength: number;
    attributes: electiveAttributes;
    batches: IBatchModel[];
    teachers: IUserModel[];
    id: string;
    constructor(args: any) {
        super();
        this.format(args);
    }
}

@Singleton
export class ElectiveRepository extends BaseRepository<IElectiveModel> {
    protected modelName = 'electives';
    protected schema: Schema = new Schema(
        {
            name: { type: String, required: true },
            description: { type: String, required: true },
            courseCode: { type: String, required: true },
            version: { type: Number, required: true },
            strength: { type: Number, required: true },
            attributes: [
                {
                    key: { type: String, required: true },
                    value: { type: String, required: true }
                }
            ],
            batches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'batches' }],
            teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }]
        },
        { collection: this.modelName }
    );

    protected formatter = ElectiveFormatter;
    @Inject
    protected dbConnection: MongoConnector;
    constructor() {
        super();
        super.init();
    }

    public async findAndPopulate(skip = 0, limit = 250, sort: string, query: any): Promise<ElectiveFormatter[]> {
        const sortObject = cleanQuery(sort, this.sortQueryFormatter);
        return (
            await this.documentModel
                .find(this.cleanWhereQuery(query))
                .sort(Object.keys(sortObject).map((key) => [key, sortObject[key]]))
                .skip(skip)
                .limit(limit)
                .populate('batches')
                .populate({
                    path: 'teachers',
                    select: 'name username _id rollNo role classes'
                })
        ).map((item) => new this.formatter(item));
    }
}
