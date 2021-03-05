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

const batchRegex = /^\d{4}-\d{4}-\d-[a-z]{4,5}-[a-z]{3,4}$/gm

export function isBatchString(str: string): boolean {
    return batchRegex.test(str);
}