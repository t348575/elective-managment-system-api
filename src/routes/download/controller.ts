import { Controller, Get, Query, Request, Response, Route, Security, Tags } from 'tsoa';
import { DownloadService } from './service';
import { ErrorType } from '../../shared/error-handler';
import { jwtToken } from '../../models/types';
import { Request as ExRequest, Response as ExResponse } from 'express';
import { provideSingleton } from '../../provide-singleton';
import { inject } from 'inversify';

@Tags('downloads')
@Route('downloads')
@provideSingleton(DownloadController)
export class DownloadController extends Controller {
    @inject(DownloadService) private service: DownloadService;
    constructor() {
        super();
    }

    @Get('temp')
    @Security('any')
    @Response<ErrorType>(401, 'ValidationError')
    @Response<ErrorType>(500, 'Unknown server error')
    public async temporaryDownload(@Query() file: string, @Request() request: ExRequest): Promise<null> {
        // @ts-ignore
        const accessToken = request.user as jwtToken;
        return this.service.getTemporaryFile(file, accessToken.id, (<any>request).res as ExResponse);
    }
}
