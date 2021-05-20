import { Body, Controller, Delete, Get, Post, Query, Request, Response, Route, Security, Tags } from 'tsoa';
import { ElectivesService } from './service';
import {
    DefaultActionResponse,
    electiveAttributes,
    jwtToken,
    unknownServerError,
    validationError
} from '../../models/types';
import { ApiError, ErrorType, UnknownApiError } from '../../shared/error-handler';
import { Request as ExRequest } from 'express';
import { Readable } from 'stream';
import csv from 'csvtojson';
import { PaginationModel } from '../../models/shared/pagination-model';
import { IElectiveModel } from '../../models/mongo/elective-repository';
import { Inject, Singleton } from 'typescript-ioc';

const adminOnly: string[] = ['admin'];
const teacherOrAdmin: string[] = ['admin', 'teacher'];
const scopeArray: string[] = ['teacher', 'admin', 'student'];

export interface AddElectives {
    name: string;
    description: string;
    courseCode: string;
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

export interface UpdateElectiveOptions {
    id: string;
    name?: string;
    description?: string;
    courseCode?: string;
    version?: number;
    strength?: number;
    attributes?: electiveAttributes;
    /**
     * Batch string
     * @pattern ^\d{4}-\d-[a-zA-Z]{4,5}-[a-zA-Z]{3,4}$
     * @example "2018-4-BTECH-CSE"
     */
    batches?: string[];
    teachers?: string[];
}

@Tags('electives')
@Route('electives')
@Singleton
export class ElectivesController extends Controller {
    @Inject
    private service: ElectivesService;
    constructor() {
        super();
    }

    @Post('add')
    @Security('jwt', adminOnly)
    @Response<ErrorType>(401, validationError)
    @Response<ErrorType>(500, unknownServerError)
    @Response<DefaultActionResponse>(200, 'Success')
    public addElectives(@Body() options: AddElectives[]) {
        return new Promise<DefaultActionResponse>(async (resolve, reject) => {
            try {
                for (const [i, v] of options.entries()) {
                    // @ts-ignore
                    options[i].attributes = ElectivesController.getAttributesAsCSV(v.attributes);
                    // @ts-ignore
                    options[i].batches = v.batches.join(',');
                    // @ts-ignore
                    options[i].teachers = v.teachers.join(',');
                }
                resolve({
                    status: true,
                    failed: await this.service.addElectives(options)
                });
            } catch (err) {
                reject(UnknownApiError(err));
            }
        });
    }

    @Post('add-csv')
    @Security('jwt', adminOnly)
    @Response<ErrorType>(401, validationError)
    @Response<ErrorType>(500, unknownServerError)
    @Response<DefaultActionResponse>(200, 'Success')
    public addElectivesCSV(@Request() request: ExRequest) {
        return new Promise<DefaultActionResponse>(async (resolve, reject) => {
            try {
                if (request.file === undefined) {
                    reject(
                        new ApiError({
                            name: 'form_error',
                            statusCode: 401,
                            message: 'Not a valid multipart form'
                        })
                    );
                } else {
                    if (request.file.originalname.indexOf('.csv') > -1) {
                        const inputStream = new Readable();
                        inputStream.push(request.file.buffer);
                        inputStream.push(null);
                        csv()
                            .fromStream(inputStream)
                            .then(async (obj) => {
                                resolve({
                                    status: true,
                                    failed: await this.service.addElectives(obj)
                                });
                            });
                    } else {
                        reject(
                            new ApiError({
                                name: 'file_type',
                                statusCode: 402,
                                message: 'Improper file type'
                            })
                        );
                    }
                }
            } catch (err) {
                reject(UnknownApiError(err));
            }
        });
    }

    /**
     * @param fields csv of fields from return schema eg: name,description,courseCode
     */
    @Get('')
    @Security('jwt', scopeArray)
    @Response<ErrorType>(401, validationError)
    @Response<ErrorType>(500, unknownServerError)
    public async getElectives(
        @Query() pageNumber: number,
        @Query() limit: number,
        @Request() request: ExRequest,
        @Query() fields?: string,
        @Query() sortBy?: string,
        @Query() courseCode?: string,
        @Query() name?: string
    ): Promise<PaginationModel<IElectiveModel>> {
        // @ts-ignore
        const accessToken = request.user as jwtToken;
        let queryObj = {};
        if (accessToken.scope === 'student') {
            // @ts-ignore
            const batch = (await this.service.getUserBatch(accessToken.id)).batch.id;
            queryObj = {
                batches: batch
            };
        }
        if (name || courseCode) {
            if (name) {
                // @ts-ignore
                queryObj.name = { $regex: name };
            }
            if (courseCode) {
                // @ts-ignore
                queryObj.courseCode = courseCode;
            }
        }
        return this.service.getPaginated(pageNumber, limit, fields || '', sortBy || '{"name":"asc"}', queryObj);
    }

    @Post('')
    @Security('jwt', teacherOrAdmin)
    @Response<ErrorType>(401, validationError)
    @Response<ErrorType>(500, unknownServerError)
    public async updateElective(@Body() options: UpdateElectiveOptions) {
        // @ts-ignore
        options._id = options.id;
        // @ts-ignore
        delete options.id;
        // @ts-ignore
        return this.service.updateElective(options._id, options);
    }

    @Delete('')
    @Security('jwt', adminOnly)
    @Response<ErrorType>(401, validationError)
    @Response<ErrorType>(500, unknownServerError)
    public async deleteElective(@Query() id: string) {
        return this.service.delete(id);
    }

    private static getAttributesAsCSV(attributes: electiveAttributes): string {
        let str = '';
        for (const v of attributes) {
            str += `${v.key},${v.value},`;
        }
        str = str.slice(0, -1);
        return str;
    }
}
