import {Body, Controller, Post, Put, Request, Response, Route, Security, Tags} from 'tsoa';
import {ProvideSingleton} from '../../shared/provide-singleton';
import {inject} from 'inversify';
import {ElectivesService} from './service';
import {DefaultActionResponse, electiveAttributes} from '../../models/types';
import {ApiError, ErrorType, UnknownApiError} from '../../shared/error-handler';
import {Request as ExRequest} from 'express';
import {Readable} from 'stream';
import csv from 'csvtojson';

const scopeArray: string[] = ['teacher', 'admin', 'student'];

const adminOnly: string[] = ['admin'];

const teacherOrStudent: string[] = ['student', 'teacher'];

export interface AddElectives {
    name: string;
    description: string;
    courseCode: string;
    /**
     * @default 1
     */
    version: number;
    strength: number;
    attributes: electiveAttributes;
    /**
     * Batch string
     * @pattern ^\d{4}-\d-[a-zA-Z]{4,5}-[a-zA-Z]{3,4}$
     * @example "2018-4-BTECH-CSE"
     */
    batches: string[];
    teachers: string[];
}

@Tags('electives')
@Route('electives')
@ProvideSingleton(ElectivesController)
export class ElectivesController extends Controller {

    constructor(@inject(ElectivesService) private service: ElectivesService) {
        super();
    }

    @Post('add')
    @Security('jwt', adminOnly)
    @Response<ErrorType>(401, 'ValidationError')
    @Response<ErrorType>(500, 'Unknown server error')
    @Response<DefaultActionResponse>(200, 'Success')
    public addElectives(
        @Body() options: AddElectives[]
    ) {
        return new Promise<DefaultActionResponse>(async (resolve, reject) => {
            try {
                resolve({ status: true, failed: await this.service.addElectives(options) });
            } catch (err) {
                reject(UnknownApiError(err));
            }
        });
    }

    @Post('add-csv')
    @Security('jwt', adminOnly)
    @Response<ErrorType>(401, 'ValidationError')
    @Response<ErrorType>(500, 'Unknown server error')
    @Response<DefaultActionResponse>(200, 'Success')
    public addElectivesCSV(
        @Request() request: ExRequest
    ) {
        return new Promise<DefaultActionResponse>(async (resolve, reject) => {
            try {
                if (request.file === undefined) {
                    reject(new ApiError({ name: 'form_error', statusCode: 401, message: 'Not a valid multipart form' }));
                }
                else {
                    if (request.file.originalname.indexOf('.csv') > -1) {
                        const inputStream = new Readable();
                        inputStream.push(request.file.buffer);
                        inputStream.push(null);
                        csv().fromStream(inputStream)
                            .then(async (obj) => {
                                resolve({ status: true, failed: await this.service.addElectives(obj) });
                            });
                    }
                    else {
                        reject(new ApiError({ name: 'file_type', statusCode: 402, message: 'Improper file type'}))
                    }
                }
            } catch (err) {
                reject(UnknownApiError(err));
            }
        });
    }
}
