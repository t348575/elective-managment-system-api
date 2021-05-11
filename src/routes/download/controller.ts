import { Body, Controller, Delete, Get, Post, Query, Request, Response, Route, Security, Tags } from 'tsoa';
import { DownloadService } from './service';
import { ApiError, ErrorType, UnknownApiError } from '../../shared/error-handler';
import { jwtToken, unautorizedError, unknownServerError, validationError } from '../../models/types';
import { Request as ExRequest, Response as ExResponse } from 'express';
import { Inject, Singleton } from 'typescript-ioc';

const scopeArray: string[] = ['admin', 'student', 'teacher'];
const teacherOrAdmin: string[] = ['admin', 'teacher'];

export interface AddClassResourceOptions {
    classId: string;
    shouldTrack: boolean;
}

const classResource = 'class-resource';

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
    @Security('jwt', scopeArray)
    @Response<ErrorType>(401, validationError)
    @Response<ErrorType>(403, unautorizedError)
    @Response<ErrorType>(500, unknownServerError)
    public async temporaryDownload(@Query() file: string, @Request() request: ExRequest): Promise<void> {
        // @ts-ignore
        const accessToken = request.user as jwtToken;
        return this.service.getTemporaryFile(file, accessToken.id, (request as ExRequest).res as ExResponse);
    }

    @Get(classResource)
    @Security('jwt', scopeArray)
    @Response<ErrorType>(401, validationError)
    @Response<ErrorType>(403, unautorizedError)
    @Response<ErrorType>(500, unknownServerError)
    public async getClassResource(@Query() fileId: string, @Request() request: ExRequest): Promise<void> {
        // @ts-ignore
        const accessToken = request.user as jwtToken;
        return this.service.getClassResource(fileId, accessToken.id, (request as ExRequest).res as ExResponse);
    }

    @Post(classResource)
    @Security('jwt', teacherOrAdmin)
    @Response<ErrorType>(401, validationError)
    @Response<ErrorType>(403, unautorizedError)
    @Response<ErrorType>(500, unknownServerError)
    public async addClassResource(@Body() options: AddClassResourceOptions, @Request() request: ExRequest) {
        try {
            if (request.file === undefined) {
                throw new ApiError({
                    name: 'form_error',
                    statusCode: 401,
                    message: 'Not a valid multipart form'
                });
            } else {
                return this.service.addClassResource(options, request as ExRequest);
            }
        } catch (err) {
            throw UnknownApiError(err);
        }
    }

    @Delete(classResource)
    @Security('jwt', teacherOrAdmin)
    @Response<ErrorType>(401, validationError)
    @Response<ErrorType>(403, unautorizedError)
    @Response<ErrorType>(500, unknownServerError)
    public async deleteClassResource(@Query() fileId: string, @Request() request: ExRequest) {
        // @ts-ignore
        const accessToken = request.user as jwtToken;
        return this.service.deleteClassResource(fileId, accessToken.id, accessToken.scope);
    }

    @Get('class-resource/tracked')
    @Security('jwt', teacherOrAdmin)
    @Response<ErrorType>(401, validationError)
    @Response<ErrorType>(403, unautorizedError)
    @Response<ErrorType>(500, unknownServerError)
    public async getTrackedClassResource(@Query() fileId: string, @Request() request: ExRequest) {
        // @ts-ignore
        const accessToken = request.user as jwtToken;
        return this.service.getTrackedClassResource(fileId, accessToken.id, accessToken.scope);
    }
}
