import { ElectiveFormatter, IElectiveModel } from './elective-repository';
import { ProvideSingleton } from '../../shared/provide-singleton';
import { BaseFormatter } from '../../util/base-formatter';
import { BaseRepository } from '../shared/base-repository';
import { Schema } from 'mongoose';
import mongoose from 'mongoose';
import { inject } from 'inversify';
import { MongoConnector } from '../../shared/mongo-connector';
import { cleanQuery } from '../../util/general-util';

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
        if (!(args instanceof mongoose.Types.ObjectId)) {
            this.format(args);
        } else {
            this.id = args.toString();
        }
        if (this.electives) {
            for (const [i, v] of args.electives.entries()) {
                if (v instanceof mongoose.Types.ObjectId) {
                    this.electives[i] = v.toString();
                } else if (typeof v === 'object') {
                    this.electives[i] = new ElectiveFormatter(v);
                }
            }
        }
    }
}

@ProvideSingleton(FormsRepository)
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
    constructor(@inject(MongoConnector) protected dbConnection: MongoConnector) {
        super();
        super.init();
    }

    public async findActive(query: any): Promise<IFormModel[]> {
        return (await this.documentModel.find(query).populate('electives')).map((item) => new this.formatter(item));
    }

    public async findAndPopulate(skip = 0, limit = 250, sort: string, query: any): Promise<FormFormatter[]> {
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
                            path: 'teachers'
                        }
                    ]
                })
        ).map((item) => new this.formatter(item));
    }
}
