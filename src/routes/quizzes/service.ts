import { Inject, Singleton } from 'typescript-ioc';
import { BaseService } from '../../models/shared/base-service';
import { IQuestionModel, IQuizModel, QuizRepository } from '../../models/mongo/quiz-repository';
import { CreateQuizOptions, StartQuizOptions, UpdateQuizOptions } from './controller';
import { checkNumber, checkString, getArgonHash, getJWT } from '../../util/general-util';
import { IClassModel } from '../../models/mongo/class-repository';
import { ClassService } from '../classes/service';
import { ApiError } from '../../shared/error-handler';
import constants from '../../constants';
import { IQuizResponseModel, QuizResponseRepository } from '../../models/mongo/quiz-response-repository';
import * as argon2 from 'argon2';
import { IUserModel } from '../../models/mongo/user-repository';
import { quizToken, scopes } from '../../models/types';
import { RedisConnector } from '../../shared/redis-connector';
import { PaginationModel } from '../../models/shared/pagination-model';

@Singleton
export class QuizzesService extends BaseService<IQuizModel> {
    @Inject protected repository: QuizRepository;
    @Inject private classService: ClassService;
    @Inject private quizResponseRepository: QuizResponseRepository;
    @Inject protected redis: RedisConnector;

    constructor() {
        super();
    }

    public async createQuiz(obj: any[], options: CreateQuizOptions) {
        const questions: IQuestionModel[] = [];
        for (const v of obj) {
            if (Object.keys(v).length < 5) {
                throw {
                    name: 'improper_format',
                    message: 'Minumum required fields not present'
                };
            }
            if (!checkString(v, 'question')) {
                throw {
                    name: 'question_no_exist',
                    message: 'The question was not given'
                };
            }
            if (!checkNumber(v, 'points', true, parseFloat)) {
                throw {
                    name: 'points_err',
                    message: 'Points not given or in incorrect format'
                };
            }
            if (!checkNumber(v, 'negativePoints', true, parseFloat)) {
                throw {
                    name: 'neg_points_err',
                    message: 'Negative points not given or in incorrect format'
                };
            }
            if (!checkNumber(v, 'answer', true)) {
                throw {
                    name: 'answer_err',
                    message: 'Answer not given or in incorrect format'
                };
            }
            if (v.answer < 1 || v.answer > Object.keys(v).length - 4) {
                throw {
                    name: 'answer_err',
                    message: 'Answer not within boundry of options'
                };
            }
            const headerNames = ['question', 'points', 'negativePoints'];
            const optionNames = Object.keys(v).filter((e) => headerNames.indexOf(e) === -1);
            const options: string[] = [];
            for (const e in v) {
                if (optionNames.indexOf(e) > -1) {
                    options.push(v[e]);
                }
            }
            questions.push({
                name: v.question,
                points: parseFloat(v.points),
                negativePoints:
                    parseFloat(v.negativePoints) > 0 ? parseFloat(v.negativePoints) * -1 : parseFloat(v.negativePoints),
                answer: parseInt(v.answer, 10),
                options
            });
        }
        if (new Date(options.start).getTime() >= new Date(options.end).getTime()) {
            throw {
                name: 'start_end_err',
                message: 'Start datetime greater than or equal to end datetime'
            };
        }
        if (options.time < 0) {
            throw {
                name: 'improper_time',
                messsage: 'An improper duration for the quiz was provided'
            };
        }
        if (options.time * 60 * 1000 > new Date(options.end).getTime() - new Date(options.start).getTime()) {
            throw {
                name: 'improper_time',
                message: 'Test duration is greater than test range datetime'
            };
        }

        if (
            (await this.classService.getPaginated(0, 1, '', '', { _id: { $in: options.classItem } })).docs.length !== 1
        ) {
            throw {
                name: 'class_err',
                message: 'Invalid class selected'
            };
        }

        await this.repository.create({
            start: new Date(options.start),
            end: new Date(options.end),
            questions,
            classItem: options.classItem as never as IClassModel,
            name: options.name,
            password: options?.password,
            time: options.time
        });
    }

    public async getNewQuizzes(classId: string, userId: string) {
        const classes = await this.classService.getActiveClasses(userId);
        if (classes.findIndex((e) => (e.id as string) === classId) === -1) {
            throw new ApiError(constants.errorTypes.forbidden);
        }
        return this.repository.findAndPopulateSafe(0, undefined, JSON.stringify({ start: 'desc' }), {
            classes: classId,
            end: {
                $gte: new Date()
            }
        });
    }

    public async getOldQuizzes(classId: string, userId: string, scope: scopes): Promise<IQuizModel[] | IQuizResponseModel[]> {
        const classes = await this.classService.getActiveClasses(userId);
        if (classes.findIndex((e) => (e.id as string) === classId) === -1) {
            throw new ApiError(constants.errorTypes.forbidden);
        }
        if (scope === 'student') {
            return this.quizResponseRepository.findAndPopulate(0, undefined, '', {
                classes: classId,
                end: {
                    $lte: new Date()
                }
            });
        }
        else {
            return this.repository.findAndPopulateSafe(0, undefined, JSON.stringify({ start: 'desc' }), {
                classes: classId,
                end: {
                    $lte: new Date()
                }
            });
        }
    }

    public async startQuiz(
        options: StartQuizOptions,
        userId: string
    ): Promise<{ question: IQuestionModel; nextRequest: string; endAt: string }> {
        const quiz: IQuizModel = await this.repository.findOne({
            _id: options.quizId,
            end: {
                $gte: new Date(new Date().getTime() + 5000)
            }
        });
        const classes = await this.classService.getActiveClasses(userId);
        if (classes.findIndex((e) => (e.id as string) === (quiz.classItem as never as string)) === -1) {
            throw new ApiError(constants.errorTypes.forbidden);
        }
        if (quiz?.password) {
            if (options.password) {
                if (!(await argon2.verify(quiz.password, options.password))) {
                    throw {
                        name: 'password_incorrect',
                        message: 'Incorrect password!'
                    };
                }
            } else {
                throw {
                    name: 'password_no_exist',
                    message: 'Password not given!'
                };
            }
        }
        await this.quizResponseRepository.startQuiz(userId, options.quizId);
        const quizResponse = await this.quizResponseRepository.findOne({ user: userId, quiz: quiz.id });
        let expireAt: number;
        if (new Date(quiz.end).getTime() < new Date().getTime() + quiz.time * 60 * 1000) {
            expireAt = Math.floor((new Date(quiz.end).getTime() - new Date().getTime()) / 1000) + 1;
        } else {
            expireAt = Math.floor(quiz.time * 60) + 1;
        }
        const endAt = new Date(new Date().getTime() + expireAt * 1000).toISOString();
        const questionRequest = await getJWT({ id: userId } as IUserModel, {
            quizId: quiz.id as string,
            responseId: quizResponse.id as string,
            question: 0
        }, expireAt, 'quiz', 'student');
        await this.redis.setex(
            `quiz::${userId}::${questionRequest.expiry}`,
            expireAt,
            questionRequest.jwt
        );
        // @ts-ignore
        delete quiz.questions[0].answer;
        return {
            question: quiz.questions[0],
            nextRequest: questionRequest.jwt,
            endAt
        };
    }

    public async getQuestion(
        questionNumber: number,
        quizTokenItem: quizToken,
        dir: 'next' | 'prev',
        answer?: number
    ): Promise<{ question: IQuestionModel; nextRequest: string; endAt: string }> {
        const response = await this.quizResponseRepository.findOne({
            quiz: quizTokenItem.stateSlice.quizId,
            user: quizTokenItem.id,
            _id: quizTokenItem.stateSlice.responseId
        });
        const secondField = dir === 'next' ? quizTokenItem.stateSlice.question + 1 : quizTokenItem.stateSlice.question - 1;
        if (response.answers.length === quizTokenItem.stateSlice.question && secondField === questionNumber) {
            let quiz: IQuizModel;
            try {
                quiz = await this.repository.getById(quizTokenItem.stateSlice.quizId);
            }
            catch(err) {
                throw {
                    name: 'removed',
                    message: 'Quiz has been deleted'
                };
            }
            if (answer) {
                if (response.answers.length >= questionNumber) {
                    response.answers[questionNumber - 1] = answer;
                }
                else {
                    response.answers.push(answer);
                }
                await this.quizResponseRepository.findAndUpdate({_id: response.id as string}, { answers: response.answers } as IQuizResponseModel);
            }
            let expireAt: number;
            if (new Date(quiz.end).getTime() < new Date().getTime() + quiz.time * 60 * 1000) {
                expireAt = Math.floor((new Date(quiz.end).getTime() - new Date().getTime()) / 1000) + 1;
            } else {
                expireAt = Math.floor(quiz.time * 60) + 1;
            }
            const endAt = new Date(new Date().getTime() + expireAt * 1000).toISOString();
            const questionRequest = await getJWT({ id: quizTokenItem.id } as IUserModel, {
                quizId: quiz.id as string,
                responseId: response.id as string,
                question: questionNumber + (dir === 'next' ? 1 : -1),
            }, expireAt, 'quiz', 'student');
            await this.redis.setex(
                `quiz::${quizTokenItem.id}::${questionRequest.expiry}`,
                expireAt,
                questionRequest.jwt
            );
            await this.redis.remove(`quiz::${quizTokenItem.id}::${quizTokenItem.exp}}`);
            // @ts-ignore
            delete quiz.questions[questionNumber].answer;
            return {
                question: quiz.questions[questionNumber],
                nextRequest: questionRequest.jwt,
                endAt
            };
        }
        else {
            throw {
                name: 'answer_mismatch',
                message: 'Quiz question number missmatch'
            };
        }
    }

    public async submitQuiz(quizTokenItem: quizToken) {
        await this.quizResponseRepository.findOne({
            quiz: quizTokenItem.stateSlice.quizId,
            user: quizTokenItem.id,
            _id: quizTokenItem.stateSlice.responseId
        });
        await this.quizResponseRepository.findAndUpdate({ _id: quizTokenItem.stateSlice.responseId }, {end: new Date().toISOString() as never as Date, attended: true} as IQuizResponseModel);
        await this.redis.remove(`quiz::${quizTokenItem.id}::${quizTokenItem.exp}}`);
    }

    public async publishScores(quizId: string, teacherId: string) {
        const quiz = (await this.repository.findAndPopulate(0, undefined, '', { _id: quizId}))[0];
        if (quiz.classItem.teacher as never as string !== teacherId) {
            throw new ApiError(constants.errorTypes.forbidden);
        }
        const responses = await this.quizResponseRepository.find('', {quiz: quiz.id}, undefined, 0);
        const attended: string[] = responses.map(e => e.user as never as string);
        const missed: string[] = quiz.classItem.students.filter(e => attended.indexOf(e as never as string) === -1).map(e => e as never as string);
        for (const response of responses) {
            let score = 0;
            for (const [i, v] of response.answers.entries()) {
                if (v === quiz.questions[i].answer) {
                    score += quiz.questions[i].points;
                }
                else {
                    score -= quiz.questions[i].negativePoints;
                }
            }
            await this.quizResponseRepository.findAndUpdate({ _id: response.id }, {score, published: true} as IQuizResponseModel);
        }
        if (new Date().getTime() < new Date(quiz.end).getTime()) {
            await this.repository.update(quiz.id, {end: new Date().toISOString() as never as Date} as IQuizModel);
        }
        for (const v of missed) {
            await this.quizResponseRepository.create({
                quiz: quizId as never as IQuizModel,
                user: v as never as IUserModel,
                answers: [],
                start: new Date().toISOString() as never as Date,
                score: 0,
                published: true,
                attended: false
            });
        }
    }

    public async deleteQuiz(quizId: string, teacherId: string) {
        const quiz = (await this.repository.findAndPopulate(0, undefined, '', { _id: quizId}))[0];
        if (quiz.classItem.teacher as never as string !== teacherId) {
            throw new ApiError(constants.errorTypes.forbidden);
        }
        await this.repository.delete(quizId);
        return this.quizResponseRepository.deleteQuizResponses(quizId);
    }

    public async updateQuiz(options: UpdateQuizOptions, teacherId: string) {
        const quiz = (await this.repository.findAndPopulate(0, undefined, '', { _id: options.quizId}))[0];
        if (quiz.classItem.teacher as never as string !== teacherId) {
            throw new ApiError(constants.errorTypes.forbidden);
        }
        if (options?.password) {
            options.password = await getArgonHash(options.password);
        }
        const quizId = options.quizId;
        // @ts-ignore
        delete options.quizId;
        return this.repository.update(quizId, options as never as IQuizModel);
    }

    public async getResults<Entity>(
        page: number,
        limit: number,
        quizId: string,
        teacherId: string
    ): Promise<PaginationModel<Entity>> {
        const quiz = (await this.repository.findAndPopulate(0, undefined, '', { _id: quizId}))[0];
        if (quiz.classItem.teacher as never as string !== teacherId) {
            throw new ApiError(constants.errorTypes.forbidden);
        }
        const skip: number = Math.max(0, page) * limit;
        // eslint-disable-next-line prefer-const
        let [count, docs] = await Promise.all([
            this.repository.count({}),
            this.repository.find('', {}, limit, skip)
        ]);
        return new PaginationModel<Entity>({
            count,
            page,
            limit,
            docs,
            totalPages: Math.ceil(count / limit)
        });
    }
}
