import { IClassModel } from './class-repository';
import { BaseFormatter } from '../../util/base-formatter';
import { Inject, Singleton } from 'typescript-ioc';
import { BaseRepository } from '../shared/base-repository';
import mongoose, { Schema } from 'mongoose';
import { MongoConnector } from '../../shared/mongo-connector';
import { ResponseFormatter } from './response-repository';

export interface IQuizModel {
    id?: string;
    classItem: IClassModel;
    name: string;
    start: Date;
    end: Date;
    time: number;
    password: string;
    questions: IQuestionModel[];
}

export interface IQuestionModel {
    points: number;
    negativePoints: number;
    name: string;
    options: string[]
}

export class IQuizFormatter extends BaseFormatter implements IQuizModel {
    classItem: IClassModel;
    end: Date;
    questions: IQuestionModel[];
    start: Date;
    time: number;
    name: string;
    password: string;
    id: string;
    constructor(args: any) {
        super();
        super.format(args);
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
            password: { type: String, required: true },
            questions: [{
                points: { type: Number, required: true },
                negativePoints: { type: Number, required: true },
                name: { type: String, required: true },
                options: [{ type: String, required: true }]
            }]
        },
        { collection: this.modelName }
    );
    protected formatter = ResponseFormatter;
    @Inject
    protected dbConnection: MongoConnector;
    constructor() {
        super();
        super.init();
    }
}
