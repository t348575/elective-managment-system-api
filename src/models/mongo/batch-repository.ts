import {BaseFormatter} from "../../util/base-formatter";
import {BaseRepository} from "../shared/base-repository";
import {Schema} from "mongoose";
import {MongoConnector} from "../../shared/mongo-connector";
import {inject} from "inversify";

export interface IBatchModel {
    id ?: string;
    year: number;
    numYears: number;
    degree: string;
    course: string;
}

export class BatchFormatter extends BaseFormatter implements  IBatchModel {
    year: number;
    numYears: number;
    degree: string;
    course: string;
    id: string;
    constructor(args: any) {
        super();
        this.format(args);
    }
}

export class BatchRepository extends BaseRepository<IBatchModel> {
    protected modelName = 'batches';
    protected schema: Schema = new Schema({
        year: { type: Number, required: true },
        numYears: { type: Number, required: true },
        degree: { type: String, required: true },
        course: { type: String, required: true }
    }, { collection: this.modelName });

    protected formatter = BatchFormatter;
    constructor(@inject(MongoConnector) protected dbConnection: MongoConnector) {
        super();
    }
}