import { IClassModel } from './class-repository';
import { BaseFormatter } from '../../util/base-formatter';
import { Inject, Singleton } from 'typescript-ioc';
import { BaseRepository } from '../shared/base-repository';
import mongoose, { Schema } from 'mongoose';
import { MongoConnector } from '../../shared/mongo-connector';
import { cleanQuery } from '../../util/general-util';

export interface IQuizModel {
    id?: string;
    classItem: IClassModel;
    name: string;
    start: Date;
    end: Date;
    time: number;
    password?: string;
    questions: IQuestionModel[];
}

export interface IQuestionModel {
    points: number;
    negativePoints: number;
    name: string;
    options: string[];
    answer: number;
}

export class QuizFormatter extends BaseFormatter implements IQuizModel {
    classItem: IClassModel;
    end: Date;
    questions: IQuestionModel[];
    start: Date;
    time: number;
    name: string;
    password?: string;
    id: string;
    constructor(args: any) {
        super();
        this.format(args);
    }
}

@Singleton
export class QuizRepository extends BaseRepository<IQuizModel> {
    protected modelName = 'quizzes';
    protected schema: Schema = new Schema(
        {
            classItem: { type: mongoose.Schema.Types.ObjectId, ref: 'classes' },
            start: { type: Date, required: true },
            end: { type: Date, required: true },
            time: { type: Number, required: true },
            name: { type: String, required: true },
            password: { type: String },
            questions: [{
                points: { type: Number, required: true },
                negativePoints: { type: Number, required: true },
                name: { type: String, required: true },
                options: [{ type: String, required: true }],
                answer: { type: Number, required: true }
            }]
        },
        { collection: this.modelName }
    );
    protected formatter = QuizFormatter;
    @Inject
    protected dbConnection: MongoConnector;
    constructor() {
        super();
        this.init();
    }

    public async findAndPopulateSafe(skip = 0, limit = 250, sort: string, query: any): Promise<QuizFormatter[]> {
        const sortObject = cleanQuery(sort, this.sortQueryFormatter);
        return (
            await this.documentModel
                .find(this.cleanWhereQuery(query))
                .sort(Object.keys(sortObject).map((key) => [key, sortObject[key]]))
                .skip(skip)
                .limit(limit)
                .populate('classItem')
                .select('classItem start end time name')
        ).map((item) => new this.formatter(item));
    }

    public async findAndPopulate(skip = 0, limit = 250, sort: string, query: any): Promise<QuizFormatter[]> {
        const sortObject = cleanQuery(sort, this.sortQueryFormatter);
        return (
            await this.documentModel
                .find(this.cleanWhereQuery(query))
                .sort(Object.keys(sortObject).map((key) => [key, sortObject[key]]))
                .skip(skip)
                .limit(limit)
                .populate('classItem')
        ).map((item) => new this.formatter(item));
    }
}
