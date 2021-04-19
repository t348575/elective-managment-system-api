import { Controller, Get, Query, Request, Response, Route, Security, Tags } from 'tsoa';
import { DownloadService } from './service';
import { ErrorType } from '../../shared/error-handler';
import { jwtToken, unknownServerError, validationError } from '../../models/types';
import { Request as ExRequest, Response as ExResponse } from 'express';
import { Inject, Singleton } from 'typescript-ioc';

@Tags('downloads')
@Route('downloads')
@Singleton
export class DownloadController extends Controller {
    @Inject
    private service: DownloadService;
    constructor() {
        super();
    }

    @Get('temp')
    @Security('any')
    @Response<ErrorType>(401, validationError)
    @Response<ErrorType>(500, unknownServerError)
    public async temporaryDownload(@Query() file: string, @Request() request: ExRequest): Promise<null> {
        // @ts-ignore
        const accessToken = request.user as jwtToken;
        return this.service.getTemporaryFile(file, accessToken.id, (request as ExRequest).res as ExResponse);
    }
}
