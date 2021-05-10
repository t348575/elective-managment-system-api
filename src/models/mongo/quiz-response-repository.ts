import { Inject, Singleton } from "typescript-ioc";
import { BaseFormatter } from "../../util/base-formatter";
import { BaseRepository } from "../shared/base-repository";
import { IQuizModel } from "./quiz-repository";
import { IUserModel } from "./user-repository";
import mongoose, { Schema } from 'mongoose';
import { MongoConnector } from "../../shared/mongo-connector";
import { cleanQuery } from "../../util/general-util";

export interface IQuizResponseModel {
    id?: string;
    user: IUserModel;
    quiz: IQuizModel;
    answers: number[];
    start: Date;
    end?: Date;
    score: number;
    published: boolean;
    attended: boolean;
}

export class QuizResponseFormatter extends BaseFormatter implements IQuizResponseModel {
    user: IUserModel;
    quiz: IQuizModel;
    answers: number[];
    start: Date;
    end?: Date;
    score: number;
    published: boolean;
    attended: boolean;
    id: string;
    constructor(args: any) {
        super();
        this.format(args);
    }
}

@Singleton
export class QuizResponseRepository extends BaseRepository<IQuizResponseModel> {
    protected modelName = 'quiz-response';
    protected schema = new Schema(
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
            quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'quizzes' },
            answers: [{ type: Number, required: true }],
            start: { type: Date, required: true },
            end: { type: Date, required: false },
            score: { type: Number, required: true },
            published: { type: Boolean, required: true },
            attended: { type: Boolean, required: true }
        },
        { collection: this.modelName }
    );
    protected formatter = QuizResponseFormatter;
    @Inject protected dbConnection: MongoConnector;
    
    constructor() {
        super();
        this.init();
    }

    public async startQuiz(userId: string, quizId: string) {
        const session = await this.documentModel.startSession();
        await session.withTransaction(async () => {
            // @ts-ignore
            await this.create({
                quiz: quizId as never as IQuizModel,
                user: userId as never as IUserModel,
                answers: [],
                start: new Date().toISOString() as never as Date,
                score: 0,
                published: false,
                attended: true
            });
        });
        session.endSession();
    }

    public async findAndPopulate(skip = 0, limit = 250, sort: string, query: any): Promise<QuizResponseFormatter[]> {
        const sortObject = cleanQuery(sort, this.sortQueryFormatter);
        return (
            await this.documentModel
                .find(this.cleanWhereQuery(query))
                .sort(Object.keys(sortObject).map((key) => [key, sortObject[key]]))
                .skip(skip)
                .limit(limit)
                .populate({
                    path: 'quiz',
                    select: 'classItem start end time name'
                })
        ).map((item) => new this.formatter(item));
    }

    public async deleteQuizResponses(quizId: string) {
        return this.documentModel.deleteMany({ quiz: quizId });
    }
}