import { Body, Controller, Delete, Get, Post, Put, Query, Request, Response, Route, Security, Tags } from 'tsoa';
import { FormsService } from './service';
import { ErrorType } from '../../shared/error-handler';
import { Request as ExRequest } from 'express';
import { Failed, jwtToken } from '../../models/types';
import { Inject, Singleton } from 'typescript-ioc';

const scopeArray: string[] = ['teacher', 'admin', 'student'];

const adminOnly: string[] = ['admin'];
const teacherOrAdmin: string[] = ['admin', 'teacher'];

/**
 * @description Provide ISO datetime strings for start and end
 */
export interface CreateFormOptions {
    start: string;
    end: string;
    numElectives: number;
    electives: string[];
}

export interface UpdateFormOptions {
    id: string;
    start?: string;
    end?: string;
    num?: number;
    electives?: string[];
}

export interface GenerateListResponse {
    status: boolean;
    downloadUri: string;
    failed: Failed[];
}

@Tags('forms')
@Route('forms')
@Singleton
export class FormsController extends Controller {
    @Inject
    private service: FormsService;
    constructor() {
        super();
    }

    @Put('create-form')
    @Security('jwt', adminOnly)
    @Response<ErrorType>(401, 'ValidationError')
    @Response<ErrorType>(500, 'Unknown server error')
    public createForm(@Body() options: CreateFormOptions) {
        return this.service.createForm(options);
    }

    @Get('batches')
    @Security('jwt', adminOnly)
    @Response<ErrorType>(401, 'ValidationError')
    @Response<ErrorType>(500, 'Unknown server error')
    public getBatches() {
        return this.service.getBatches();
    }

    @Get('active-forms')
    @Security('jwt', scopeArray)
    @Response<ErrorType>(401, 'ValidationError')
    @Response<ErrorType>(500, 'Unknown server error')
    public async activeForms(@Request() request: ExRequest) {
        // @ts-ignore
        const accessToken = request.user as jwtToken;
        return this.service.getActiveForms(accessToken.id, accessToken.scope);
    }

    @Get('')
    @Security('jwt', adminOnly)
    @Response<ErrorType>(401, 'ValidationError')
    @Response<ErrorType>(500, 'Unknown server error')
    public async allForms(@Query() pageNumber: number, @Query() limit: number) {
        return this.service.getPaginated(pageNumber, limit, '', '{"end": "desc"}', {});
    }

    @Get('generate-elective-list')
    @Security('jwt', teacherOrAdmin)
    @Response<ErrorType>(401, 'ValidationError')
    @Response<ErrorType>(500, 'Unknown server error')
    public async generateList(
        @Query() id: string,
        @Request() request: ExRequest,
        @Query() closeForm = false
    ): Promise<GenerateListResponse> {
        // @ts-ignore
        const accessToken = request.user as jwtToken;
        return this.service.generateList(id, closeForm, accessToken.id);
    }

    @Post('create-classes')
    @Security('jwt', adminOnly)
    @Response<ErrorType>(401, 'ValidationError')
    @Response<ErrorType>(500, 'Unknown server error')
    public async createClass(@Query() formId: string) {
        return this.service.createClass(formId);
    }

    @Post('')
    @Security('jwt', adminOnly)
    @Response<ErrorType>(401, 'ValidationError')
    @Response<ErrorType>(500, 'Unknown server error')
    public async updateForm(@Body() options: UpdateFormOptions) {
        return this.service.updateForm(options);
    }

    @Delete('')
    @Security('jwt', adminOnly)
    @Response<ErrorType>(401, 'ValidationError')
    @Response<ErrorType>(500, 'Unknown server error')
    public async deleteForm(@Query() id: string) {
        return this.service.delete(id);
    }
}
