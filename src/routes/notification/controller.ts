import { Body, Controller, Get, Post, Put, Request, Response, Route, Security, Tags, Path } from 'tsoa';
import { NotificationService } from './service';
import { ErrorType } from '../../shared/error-handler';
import { jwtToken } from '../../models/types';
import { Request as ExRequest } from 'express';
import { Inject, Singleton } from 'typescript-ioc';

const scopeArray: string[] = ['teacher', 'admin', 'student'];
export interface SubscribeOptions {
    name: string;
    sub: {
        endpoint: string;
        expirationTime: null | number;
        keys: {
            p256dh: string;
            auth: string;
        };
    };
}

@Tags('notifications')
@Route('notifications')
@Singleton
export class NotificationController extends Controller {
    @Inject
    private service: NotificationService;
    constructor() {
        super();
    }

    @Put('subscribe')
    @Security('jwt', scopeArray)
    @Response<ErrorType>(401, 'ValidationError')
    @Response<ErrorType>(500, 'Unknown server error')
    public async subscribe(@Body() options: SubscribeOptions, @Request() request: ExRequest) {
        // @ts-ignore
        const accessToken = request.user as jwtToken;
        return this.service.subscribe(options, accessToken.id);
    }

    @Post('unsubscribe')
    @Security('jwt', scopeArray)
    @Response<ErrorType>(401, 'ValidationError')
    @Response<ErrorType>(500, 'Unknown server error')
    public async unsubscribe(@Body() options: SubscribeOptions, @Request() request: ExRequest) {
        // @ts-ignore
        const accessToken = request.user as jwtToken;
        return this.service.unsubscribe(options, accessToken.id);
    }

    @Get('isSubscribed/{name}')
    @Security('jwt', scopeArray)
    @Response<ErrorType>(401, 'ValidationError')
    @Response<ErrorType>(500, 'Unknown server error')
    public async isSubscribed(
        @Path('name') name: string,
        @Request() request: ExRequest
    ) {
        // @ts-ignore
        const accessToken = request.user as jwtToken;
        return this.service.isSubscribed(name, accessToken.id);
    }
}
