import { Body, Controller, Get, Put, Query, Request, Response, Route, Security, Tags } from 'tsoa';
import { ResponseService } from './service';
import { ErrorType } from '../../shared/error-handler';
import { Request as ExRequest } from 'express';
import { jwtToken } from '../../models/types';
import { provideSingleton } from '../../provide-singleton';
import { inject } from 'inversify';
const studentOnly: string[] = ['student'];
const teacherOrAdmin: string[] = ['admin', 'teacher'];

export interface FormResponseOptions {
    id: string;
    electives: string[];
}

@Tags('form-response')
@Route('form-response')
@provideSingleton(ResponseController)
export class ResponseController extends Controller {
    @inject(ResponseService) private service: ResponseService;
    constructor() {
        super();
    }

    @Put('')
    @Security('jwt', studentOnly)
    @Response<ErrorType>(401, 'ValidationError')
    @Response<ErrorType>(500, 'Unknown server error')
    public async formResponse(@Body() options: FormResponseOptions, @Request() request: ExRequest) {
        // @ts-ignore
        const accessToken = request.user as jwtToken;
        return this.service.respondToForm(options, accessToken);
    }

    @Get('')
    @Security('jwt', teacherOrAdmin)
    @Response<ErrorType>(401, 'ValidationError')
    @Response<ErrorType>(500, 'Unknown server error')
    public async getResponses(@Query() id: string, @Query() pageNumber: number, @Query() limit: number) {
        return this.service.getPaginated(pageNumber, limit, '', '{"time":"desc"}', {
            form: id
        });
    }
}
