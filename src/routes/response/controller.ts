import { Body, Controller, Get, Put, Query, Request, Response, Route, Security, Tags } from 'tsoa';
import { ResponseService } from './service';
import { ErrorType } from '../../shared/error-handler';
import { Request as ExRequest } from 'express';
import { jwtToken, unknownServerError, validationError } from '../../models/types';
import { Inject, Singleton } from 'typescript-ioc';
import { PaginationModel } from '../../models/shared/pagination-model';
import { IResponseModel } from '../../models/mongo/response-repository';
const studentOnly: string[] = ['student'];
const teacherOrAdmin: string[] = ['admin', 'teacher'];

export interface FormResponseOptions {
    id: string;
    electives: string[];
}

@Tags('form-response')
@Route('form-response')
@Singleton
export class ResponseController extends Controller {
    @Inject
    private service: ResponseService;
    constructor() {
        super();
    }

    @Put('')
    @Security('jwt', studentOnly)
    @Response<ErrorType>(401, validationError)
    @Response<ErrorType>(500, unknownServerError)
    public async formResponse(@Body() options: FormResponseOptions, @Request() request: ExRequest) {
        // @ts-ignore
        const accessToken = request.user as jwtToken;
        return this.service.respondToForm(options, accessToken);
    }

    @Get('')
    @Security('jwt', teacherOrAdmin)
    @Response<ErrorType>(401, validationError)
    @Response<ErrorType>(500, unknownServerError)
    public async getResponses(
        @Query() id: string,
        @Query() pageNumber: number,
        @Query() limit: number
    ): Promise<PaginationModel<IResponseModel>> {
        return this.service.getPaginated(pageNumber, limit, '', '{"time":"desc"}', {
            form: id
        });
    }
}
