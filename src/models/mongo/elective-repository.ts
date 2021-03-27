import {electiveAttributes} from "../types";
import {BatchFormatter, IBatchModel} from './batch-repository';
import {IUserModel, SafeUser, UserFormatter} from './user-repository';
import {BaseFormatter, remove} from '../../util/base-formatter';
import {BaseRepository} from "../shared/base-repository";
import {Schema} from "mongoose";
import mongoose from 'mongoose';
import {inject} from "inversify";
import {MongoConnector} from "../../shared/mongo-connector";
import {ProvideSingleton} from '../../shared/provide-singleton';
import {cleanQuery} from '../../util/general-util';

export interface IElectiveModel {
    id ?: string;
    name: string;
    description: string;
    courseCode: string;
    version: number;
    strength: number;
    active: boolean;
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
    active: boolean;
    attributes: electiveAttributes;
    batches: IBatchModel[];
    teachers: IUserModel[];
    id: string;
    constructor(args: any) {
        super();
        if (!(args instanceof mongoose.Types.ObjectId)) {
            this.format(args);
        }
        else {
            this.id = args.toString();
        }
        if (this.batches) {
            for (const [i, v] of args.batches.entries()) {
                if (v instanceof mongoose.Types.ObjectId) {
                    this.batches[i] = v.toString();
                }
                else if (typeof v === 'object') {
                    this.batches[i] = new BatchFormatter(v);
                }
            }
        }
        if (this.teachers) {
            for (const [i, v] of args.teachers.entries()) {
                if (v instanceof mongoose.Types.ObjectId) {
                    this.teachers[i] = v.toString();
                }
                else if (typeof v === 'object') {
                    // @ts-ignore
                    this.teachers[i] = remove<IUserModel, SafeUser>(new UserFormatter(v), ['password']);
                }
            }
        }
        if (this.attributes) {
            for (const [i, v] of args.attributes.entries()) {
                if (args.attributes[i]._id) {
                    // @ts-ignore
                    this.attributes[i].id = args.attributes[i]._id.toString();
                    // @ts-ignore
                    delete this.attributes[i]._id;
                }
            }
        }
    }
}

@ProvideSingleton(ElectiveRepository)
export class ElectiveRepository extends BaseRepository<IElectiveModel> {
    protected modelName: string  = 'electives';
    protected schema: Schema = new Schema({
        name: { type: String, required: true },
        description: { type: String, required: true },
        courseCode: { type: String, required: true },
        version: { type: Number, required: true },
        strength: { type: Number, required: true },
        active: { type: Boolean, required: true },
        attributes: [{
            key: { type: String, required: true },
            value: { type: String, required: true }
        }],
        batches: [{ type : mongoose.Schema.Types.ObjectId, ref: 'batches' }],
        teachers: [{ type : mongoose.Schema.Types.ObjectId, ref: 'users' }]
    }, { collection: this.modelName });

    protected formatter = ElectiveFormatter;
    constructor(@inject(MongoConnector) protected dbConnection: MongoConnector) {
        super();
        super.init();
    }

    public async findAndPopulate(
        skip: number = 0,
        limit: number = 250,
        sort: string,
        query: any
    ): Promise<ElectiveFormatter[]> {
        const sortObject = cleanQuery(sort, this.sortQueryFormatter);
        return (
            await this.documentModel
            .find(this.cleanWhereQuery(query))
            .sort(Object.keys(sortObject).map(key => [key, sortObject[key]]))
            .skip(skip)
            .limit(limit)
            .populate('batches')
            .populate('teachers')
        )
        .map(item => new this.formatter(item));
    }
}
