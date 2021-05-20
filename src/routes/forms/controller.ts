import { Body, Controller, Delete, Get, Post, Put, Query, Request, Response, Route, Security, Tags } from 'tsoa';
import { FormsService } from './service';
import { ErrorType } from '../../shared/error-handler';
import { Request as ExRequest } from 'express';
import { Failed, jwtToken, unknownServerError, validationError } from '../../models/types';
import { Inject, Singleton } from 'typescript-ioc';
import { PaginationModel } from '../../models/shared/pagination-model';
import { IFormModel } from '../../models/mongo/form-repository';

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
    shouldSelectAll: boolean;
    electives: string[];
}

export interface UpdateFormOptions {
    id: string;
    start?: string;
    end?: string;
    shouldSelect?: number;
    selectAllAtForm?: boolean;
    electives?: string[];
    active?: boolean;
}

export interface GenerateListResponse {
    status: boolean;
    downloadUri: string;
    failed: Failed[];
}

export interface AddExplicitOptions {
    id: string;
    options: { user: string; electives: string[] }[];
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
    @Response<ErrorType>(401, validationError)
    @Response<ErrorType>(500, unknownServerError)
    public createForm(@Body() options: CreateFormOptions) {
        return this.service.createForm(options);
    }

    @Get('batches')
    @Security('jwt', adminOnly)
    @Response<ErrorType>(401, validationError)
    @Response<ErrorType>(500, unknownServerError)
    public getBatches() {
        return this.service.getBatches();
    }

    @Get('active-forms')
    @Security('jwt', scopeArray)
    @Response<ErrorType>(401, validationError)
    @Response<ErrorType>(500, unknownServerError)
    public async activeForms(@Request() request: ExRequest) {
        // @ts-ignore
        const accessToken = request.user as jwtToken;
        return this.service.getActiveForms(accessToken.id, accessToken.scope);
    }

    @Get('')
    @Security('jwt', teacherOrAdmin)
    @Response<ErrorType>(401, validationError)
    @Response<ErrorType>(500, unknownServerError)
    public async allForms(@Query() pageNumber: number, @Query() limit: number): Promise<PaginationModel<IFormModel>> {
        return this.service.getPaginated(pageNumber, limit, '', '{"end": "desc"}', {});
    }

    @Get('generate-elective-list')
    @Security('jwt', teacherOrAdmin)
    @Response<ErrorType>(401, validationError)
    @Response<ErrorType>(500, unknownServerError)
    public async generateList(@Query() id: string, @Request() request: ExRequest, @Query() closeForm = false) {
        // @ts-ignore
        const accessToken = request.user as jwtToken;
        return this.service.generateList(id, closeForm, accessToken.id);
    }

    @Get('raw-list')
    @Security('jwt', teacherOrAdmin)
    @Response<ErrorType>(401, validationError)
    @Response<ErrorType>(500, unknownServerError)
    public async genRawList(@Query() id: string) {
        return this.service.rawList(id);
    }

    @Post('create-classes')
    @Security('jwt', adminOnly)
    @Response<ErrorType>(401, validationError)
    @Response<ErrorType>(500, unknownServerError)
    public async createClass(@Query() formId: string) {
        return this.service.createClass(formId);
    }

    @Post('')
    @Security('jwt', adminOnly)
    @Response<ErrorType>(401, validationError)
    @Response<ErrorType>(500, unknownServerError)
    public async updateForm(@Body() options: UpdateFormOptions) {
        return this.service.updateForm(options);
    }

    @Delete('')
    @Security('jwt', adminOnly)
    @Response<ErrorType>(401, validationError)
    @Response<ErrorType>(500, unknownServerError)
    public async deleteForm(@Query() id: string) {
        return this.service.removeForm(id);
    }

    @Put('explicit')
    @Security('jwt', teacherOrAdmin)
    @Response<ErrorType>(401, validationError)
    @Response<ErrorType>(500, unknownServerError)
    public async setExplicit(@Body() options: AddExplicitOptions) {
        await this.service.setExplicit(options);
    }
}
