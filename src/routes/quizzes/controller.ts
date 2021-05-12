import { Query, Body, Post, Request, Response, Route, Security, Tags, Controller, Get, Put, Delete } from 'tsoa';
import { Inject, Singleton } from 'typescript-ioc';
import { QuizzesService } from './service';
import { ApiError, ErrorType } from '../../shared/error-handler';
import { unknownServerError, validationError, jwtToken, quizToken } from '../../models/types';
import { Request as ExRequest } from 'express';
import { Readable } from 'stream';
import csv from 'csvtojson';
import { getArgonHash } from '../../util/general-util';
import { IQuizResponseModel } from '../../models/mongo/quiz-response-repository';
import { PaginationModel } from '../../models/shared/pagination-model';

const studentOnly: string[] = ['student'];
const teacherOnly: string[] = ['teacher'];
const studentOrTeacher: string[] = ['student', 'teacher'];

export interface CreateQuizOptions {
    password?: string;
    classItem: string;
    name: string;
    start: string;
    end: string;
    time: number;
}

export interface StartQuizOptions {
    password?: string;
    quizId: string;
};

export interface UpdateQuizOptions {
    quizId: string;
    password?: string;
    start?: string;
    end?: string;
    name?: string;
    time?: number;
}

@Tags('quizzes')
@Route('quizzes')
@Singleton
export class QuizzesController extends Controller {
    @Inject private service: QuizzesService;
    constructor() {
        super();
    }

    @Post('create-quiz')
    @Security('jwt', teacherOnly)
    @Response<ErrorType>(401, validationError)
    @Response<ErrorType>(500, unknownServerError)
    public createQuiz(
        @Body() options: CreateQuizOptions,
        @Request() request: ExRequest
    ) {
        return new Promise<void>((resolve, reject) => {
            if (request.file === undefined) {
                reject(new ApiError({
                    name: 'form_error',
                    statusCode: 400,
                    message: 'Not a valid multipart form'
                }));
            }
            else {
                if (request.file.originalname.indexOf('.csv') > -1) {
                    const inputStream = new Readable();
                    inputStream.push(request.file.buffer);
                    inputStream.push(null);
                    csv()
                    .fromStream(inputStream)
                    .then(async (obj) => {
                        if (options?.password) {
                            options.password = await getArgonHash(options.password);
                        }
                        try {
                            await this.service.createQuiz(obj, options);
                            resolve();
                        }
                        catch(err) {
                            reject(new ApiError({
                                name: err.name,
                                message: err?.message,
                                statusCode: 400
                            }));
                        }
                    });
                }
                else {
                    reject(new ApiError({
                        name: 'file_type',
                        statusCode: 400,
                        message: 'Improper file type'
                    }));
                }
            }
        });
    }

    @Get('new')
    @Security('jwt', studentOrTeacher)
    @Response<ErrorType>(401, validationError)
    @Response<ErrorType>(500, unknownServerError)
    public getNewQuizzes(
        @Query('classId') classId: string,
        @Request() request: ExRequest
    ) {
        // @ts-ignore
        const accessToken = request.user as jwtToken;
        return this.service.getNewQuizzes(classId, accessToken.id, accessToken.scope);
    }

    @Get('old')
    @Security('jwt', studentOnly)
    @Response<ErrorType>(401, validationError)
    @Response<ErrorType>(500, unknownServerError)
    public async getOldQuizzes(
        @Query('classId') classId: string,
        @Request() request: ExRequest
    ) {
        // @ts-ignore
        const accessToken = request.user as jwtToken;
        return this.service.getOldQuizzes(classId, accessToken.id);
    }

    @Get('results')
    @Security('jwt', teacherOnly)
    @Response<ErrorType>(401, validationError)
    @Response<ErrorType>(500, unknownServerError)
    public async getResults(
        @Query('quizId') quizId: string,
        @Query('page') page: number,
        @Request() request: ExRequest,
        @Query('limit') limit = 25
    ): Promise<PaginationModel<IQuizResponseModel>> {
        // @ts-ignore
        const accessToken = request.user as jwtToken;
        return this.service.getResults<IQuizResponseModel>(page, limit, quizId, accessToken.id);
    }

    @Put('start-quiz')
    @Security('jwt', studentOnly)
    @Response<ErrorType>(401, validationError)
    @Response<ErrorType>(500, unknownServerError)
    public async startQuiz(
        @Body() options: StartQuizOptions,
        @Request() request: ExRequest
    ) {
        // @ts-ignore
        const accessToken = request.user as jwtToken;
        return this.service.startQuiz(options, accessToken.id);
    }

    @Get('question')
    @Security('quiz', studentOnly)
    @Response<ErrorType>(401, validationError)
    @Response<ErrorType>(500, unknownServerError)
    public async getNextQuestion(
        @Query('num') questionNumber: number,
        @Query('dir') dir: 'next' | 'prev',
        @Request() request: ExRequest,
        @Query('ans') answer: number
    ) {
        // @ts-ignore
        const quizToken = request.quiz as quizToken;
        return this.service.getQuestion(questionNumber, quizToken, dir, answer);
    }

    @Get('submit-quiz')
    @Security('quiz', studentOnly)
    @Response<ErrorType>(401, validationError)
    @Response<ErrorType>(500, unknownServerError)
    public async closeQuiz(
        @Request() request: ExRequest
    ) {
        // @ts-ignore
        const quizToken = request.quiz as quizToken;
        return this.service.submitQuiz(quizToken);
    }

    @Put('publish-score')
    @Security('jwt', teacherOnly)
    @Response<ErrorType>(401, validationError)
    @Response<ErrorType>(500, unknownServerError)
    public async publishScores(
        @Query('quizId') quizId: string,
        @Request() request: ExRequest
    ) {
        // @ts-ignore
        const accessToken = request.user as jwtToken;
        return this.service.publishScores(quizId, accessToken.id);
    }

    @Delete('')
    @Security('jwt', teacherOnly)
    @Response<ErrorType>(401, validationError)
    @Response<ErrorType>(500, unknownServerError)
    public async deleteQuiz(
        @Query('quizId') quizId: string,
        @Request() request: ExRequest
    ) {
        // @ts-ignore
        const accessToken = request.user as jwtToken;
        return this.service.deleteQuiz(quizId, accessToken.id);
    }

    @Put('')
    @Security('jwt', teacherOnly)
    @Response<ErrorType>(401, validationError)
    @Response<ErrorType>(500, unknownServerError)
    public async updateQuiz(
        @Body() options: UpdateQuizOptions,
        @Request() request: ExRequest
    ) {
        // @ts-ignore
        const accessToken = request.user as jwtToken;
        return this.service.updateQuiz(options, accessToken.id);
    }
}
