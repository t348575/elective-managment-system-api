import {Controller, Get, Query, Request, Response, Route, Security, Tags} from 'tsoa';
import {ProvideSingleton} from '../../shared/provide-singleton';
import {DownloadService} from './service';
import {inject} from 'inversify';
import {ErrorType} from '../../shared/error-handler';
import {jwtToken} from '../../models/types';
import {Request as ExRequest, Response as ExResponse} from 'express';

@Tags('downloads')
@Route('downloads')
@ProvideSingleton(DownloadController)
export class DownloadController extends Controller {
    constructor(
        @inject(DownloadService) private service: DownloadService
    ) {
        super();
    }

    @Get('temp')
    @Security('any')
    @Response<ErrorType>(401, 'ValidationError')
    @Response<ErrorType>(500, 'Unknown server error')
    public async temporaryDownload(
        @Query() file: string,
        @Request() request: ExRequest
    ): Promise<null> {
        // @ts-ignore
        const accessToken = request.user as jwtToken;
        return this.service.getTemporaryFile(file, accessToken.id, (<any>request).res as ExResponse);
    }
}
