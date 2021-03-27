import {Body, Controller, Delete, Get, Post, Put, Query, Request, Response, Route, Security, Tags} from 'tsoa';
import {ProvideSingleton} from '../../shared/provide-singleton';
import {inject} from 'inversify';
import {FormsService} from './service';
import {ErrorType} from '../../shared/error-handler';
import {Request as ExRequest} from 'express';
import {jwtToken} from '../../models/types';
import {FormFormatter, IFormModel} from '../../models/mongo/form-repository';

const scopeArray: string[] = ['teacher', 'admin', 'student'];

const adminOnly: string[] = ['admin'];

const studentOnly: string[] = ['student'];

const teacherOrStudent: string[] = ['student', 'teacher'];

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
    start ?: string;
    end ?: string;
    num ?: number;
    electives ?: string[];
}

@Tags('forms')
@Route('forms')
@ProvideSingleton(FormsController)
export class FormsController extends Controller {
    constructor(
        @inject(FormsService) private service: FormsService
    ) {
        super();
    }

    @Put('create-form')
    @Security('jwt', adminOnly)
    @Response<ErrorType>(401, 'ValidationError')
    @Response<ErrorType>(500, 'Unknown server error')
    public createForm(
        @Body() options: CreateFormOptions
    ) {
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
    public async activeForms(
        @Request() request: ExRequest
    ) {
        // @ts-ignore
        const accessToken = request.user as jwtToken;
        return this.service.getActiveForms(accessToken.id, accessToken.scope);
    }

    @Get('')
    @Security('jwt', adminOnly)
    @Response<ErrorType>(401, 'ValidationError')
    @Response<ErrorType>(500, 'Unknown server error')
    public async allForms(
        @Query() pageNumber: number,
        @Query() limit: number
    ) {
        return this.service.getPaginated(pageNumber, limit, '', '{"end": "desc"}', {});
    }

    @Get('generate-elective-list')
    @Security('jwt', teacherOrAdmin)
    @Response<ErrorType>(401, 'ValidationError')
    @Response<ErrorType>(500, 'Unknown server error')
    public async generateList(
        @Query() id: string,
        @Query() format: 'json' | 'csv',
        @Query() closeForm: boolean = false
    ) {
        return this.service.generateList(id, format, closeForm);
    }

    @Post('')
    @Security('jwt', adminOnly)
    @Response<ErrorType>(401, 'ValidationError')
    @Response<ErrorType>(500, 'Unknown server error')
    public async updateForm(
        @Body() options: UpdateFormOptions
    ) {
        return this.service.updateForm(options);
    }

    @Delete('')
    @Security('jwt', adminOnly)
    @Response<ErrorType>(401, 'ValidationError')
    @Response<ErrorType>(500, 'Unknown server error')
    public async deleteForm(
        @Query() id: string
    ) {
        return this.service.delete(id);
    }
}