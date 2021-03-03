import {electiveAttributes} from "../types";
import {IBatchModel} from "./batch-repository";
import {IUserModel} from "./user-repository";
import {BaseFormatter} from "../../util/base-formatter";
import {BaseRepository} from "../shared/base-repository";
import {Schema} from "mongoose";
import * as mongoose from 'mongoose';
import {inject} from "inversify";
import {MongoConnector} from "../../shared/mongo-connector";

export interface IElectiveModel {
    id ?: string;
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

export class ElectiveRepository extends BaseRepository<IElectiveModel> {
    protected modelName: string = 'electives';
    protected schema: Schema = new Schema({
        name: { type: String, required: true },
        description: { type: String, required: true },
        courseCode: { type: String, required: true },
        version: { type: Number, required: true },
        strength: { type: String, required: true },
        attributes: [{
            key: { type: String, required: true },
            value: { type: String, required: true }
        }],
        batches: [{ type : mongoose.Schema.Types.ObjectId, ref: 'batches' }],
        teachers: [{ type : mongoose.Schema.Types.ObjectId, ref: 'users' }]
    }, { collection: 'electives' });

    protected formatter = ElectiveFormatter;
    constructor(@inject(MongoConnector) protected dbConnection: MongoConnector) {
        super();
    }
}