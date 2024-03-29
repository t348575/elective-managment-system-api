import { BaseFormatter } from '../../util/base-formatter';
import { BaseRepository } from '../shared/base-repository';
import { MongoConnector } from '../../shared/mongo-connector';
import { Schema } from 'mongoose';
import { Inject, Singleton } from 'typescript-ioc';

export interface IBatchModel {
    id?: string;
    year: number;
    numYears: number;
    degree: string;
    course: string;
    /**
     * Batch string
     * @pattern ^\d{4}-\d-[a-zA-Z]{4,5}-[a-zA-Z]{3,4}$
     * @example "2018-4-BTECH-CSE"
     */
    batchString: string;
}

export class BatchFormatter extends BaseFormatter implements IBatchModel {
    year: number;
    numYears: number;
    degree: string;
    course: string;
    batchString: string;
    id: string;
    constructor(args: any) {
        super();
        this.format(args);
    }
}

@Singleton
export class BatchRepository extends BaseRepository<IBatchModel> {
    protected modelName = 'batches';
    protected schema: Schema = new Schema(
        {
            year: { type: Number, required: true },
            numYears: { type: Number, required: true },
            degree: { type: String, required: true },
            course: { type: String, required: true },
            batchString: { type: String, required: true, unique: true }
        },
        { collection: this.modelName }
    );

    protected formatter = BatchFormatter;
    @Inject
    protected dbConnection: MongoConnector;
    constructor() {
        super();
        this.init();
    }
}

export function isBatchString(str: string): boolean {
    return /^\d{4}-\d-[a-zA-Z]{4,5}-[a-zA-Z]{3,4}$/gm.test(str);
}

export function batchStringToModel(str: string): BatchFormatter {
    return new BatchFormatter({
        year: str.match(/^\d{4}/)?.[0],
        numYears: str.match(/(?<=.{4})(\d)/)?.[0],
        degree: str.match(/(?<=.{7})([a-zA-Z]{4,5})/)?.[0],
        course: str.match(/(?<=.{10})([a-zA-Z]{3,4})/)?.[0],
        batchString: str
    });
}
