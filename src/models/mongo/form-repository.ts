import { IElectiveModel } from './elective-repository';
import { BaseFormatter } from '../../util/base-formatter';
import { BaseRepository } from '../shared/base-repository';
import mongoose, { Schema } from 'mongoose';
import { MongoConnector } from '../../shared/mongo-connector';
import { cleanQuery } from '../../util/general-util';
import { provideSingleton } from '../../provide-singleton';
import { inject } from 'inversify';

export interface IFormModel {
    id?: string;
    start: Date;
    end: Date;
    num: number;
    electives: IElectiveModel[];
    active: boolean;
}

export class FormFormatter extends BaseFormatter implements IFormModel {
    electives: IElectiveModel[];
    end: Date;
    num: number;
    start: Date;
    id: string;
    active: boolean;
    constructor(args: any) {
        super();
        this.format(args);
    }
}

@provideSingleton(FormsRepository)
export class FormsRepository extends BaseRepository<IFormModel> {
    protected modelName = 'forms';
    protected schema: Schema = new Schema(
        {
            start: { type: Date, required: true },
            end: { type: Date, required: true },
            num: { type: Number, required: true },
            active: { type: Boolean, required: true },
            electives: [{ type: mongoose.Schema.Types.ObjectId, ref: 'electives' }]
        },
        { collection: this.modelName }
    );

    protected formatter = FormFormatter;
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

    public async findActive(query: any): Promise<IFormModel[]> {
        return (await this.documentModel.find(query).populate('electives')).map((item) => new this.formatter(item));
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
        ).map((item) => new this.formatter(item));
    }
}
