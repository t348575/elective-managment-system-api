import { IElectiveModel } from './elective-repository';
import { BaseFormatter } from '../../util/base-formatter';
import { BaseRepository } from '../shared/base-repository';
import mongoose, { Schema } from 'mongoose';
import { MongoConnector } from '../../shared/mongo-connector';
import { cleanQuery } from '../../util/general-util';
import { Inject, Singleton } from 'typescript-ioc';
import { IUserModel } from './user-repository';

export interface ExplicitElectives {
    user: IUserModel;
    electives: IElectiveModel[];
}

export interface IFormModel {
    id?: string;
    start: Date;
    end: Date;
    shouldSelect: number;
    selectAllAtForm: boolean;
    electives: IElectiveModel[];
    active: boolean;
    explicit: ExplicitElectives[];
}

export class FormFormatter extends BaseFormatter implements IFormModel {
    electives: IElectiveModel[];
    end: Date;
    shouldSelect: number;
    selectAllAtForm: boolean;
    start: Date;
    id: string;
    active: boolean;
    explicit: ExplicitElectives[];
    constructor(args: any) {
        super();
        this.format(args);
    }
}

@Singleton
export class FormsRepository extends BaseRepository<IFormModel> {
    protected modelName = 'forms';
    protected schema: Schema = new Schema(
        {
            start: { type: Date, required: true },
            end: { type: Date, required: true },
            shouldSelect: { type: Number, required: true },
            selectAllAtForm: { type: Number, required: true },
            electives: [{ type: mongoose.Schema.Types.ObjectId, ref: 'electives' }],
            active: { type: Boolean, required: true, default: true },
            explicit: [
                {
                    user: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
                    electives: [{ type: mongoose.Schema.Types.ObjectId, ref: 'electives' }]
                }
            ]
        },
        { collection: this.modelName }
    );

    protected formatter = FormFormatter;
    @Inject
    protected dbConnection: MongoConnector;
    constructor() {
        super();
        super.init();
    }

    public async findActive(): Promise<IFormModel[]> {
        return (
            await this.documentModel
                .find({ end: { $gte: new Date() }, active: true })
                .populate({
                    path: 'electives',
                    populate: [
                        {
                            path: 'batches'
                        },
                        {
                            path: 'teachers',
                            select: 'name username _id rollNo role classes'
                        }
                    ]
                })
                .populate({
                    path: 'explicit.electives'
                })
                .populate({
                    path: 'explicit.user',
                    select: 'name username _id rollNo role batch',
                    populate: ['batch']
                })
        ).map((item) => new this.formatter(item));
    }

    public async findAndPopulate(sort: string, query: any, skip = 0, limit = 250): Promise<FormFormatter[]> {
        const sortObject = cleanQuery(sort, this.sortQueryFormatter);
        return (
            await this.documentModel
                .find(this.cleanWhereQuery(query))
                .sort(Object.keys(sortObject).map((key) => [key, sortObject[key]]))
                .skip(skip)
                .limit(limit)
                .populate({
                    path: 'electives',
                    populate: [
                        {
                            path: 'batches'
                        },
                        {
                            path: 'teachers',
                            select: 'name username _id rollNo role classes'
                        }
                    ]
                })
                .populate({
                    path: 'explicit.electives'
                })
                .populate({
                    path: 'explicit.user',
                    select: 'name username _id rollNo role batch',
                    populate: ['batch']
                })
        ).map((item) => new this.formatter(item));
    }

    public async setExplicit(id: string, options: { user: string; electives: string[] }[]) {
        return this.documentModel.findByIdAndUpdate(id, { explicit: options });
    }
}
