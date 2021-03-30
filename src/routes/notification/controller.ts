import {ProvideSingleton} from '../../shared/provide-singleton';
import {Body, Controller, Get, Post, Put, Query, Request, Response, Route, Security, Tags} from 'tsoa';
import {inject} from 'inversify';
import constants from '../../constants';
import {NotificationService} from './service';
import {ErrorType} from '../../shared/error-handler';
import {jwtToken} from '../../models/types';
import {Request as ExRequest} from 'express';

const scopeArray: string[] = ['teacher', 'admin', 'student'];

const adminOnly: string[] = ['admin'];

const studentOnly: string[] = ['student'];

const teacherOrStudent: string[] = ['student', 'teacher'];

const teacherOrAdmin: string[] = ['admin', 'teacher'];

export interface SubscribeOptions {
    name: string;
    sub: {
        endpoint: string;
        expirationTime: null | number;
        keys: {
            p256dh: string;
            auth: string;
        }
    }
}

@Tags('notifications')
@Route('notifications')
@ProvideSingleton(NotificationController)
export class NotificationController extends Controller {
    constructor(
        @inject(NotificationService) private service: NotificationService
    ) {
        super();
    }

    @Put('subscribe')
    @Security('jwt', scopeArray)
    @Response<ErrorType>(401, 'ValidationError')
    @Response<ErrorType>(500, 'Unknown server error')
    public async subscribe(
        @Body() options: SubscribeOptions,
        @Request() request: ExRequest
    ) {
        // @ts-ignore
        const accessToken = request.user as jwtToken;
        return this.service.subscribe(options, accessToken.id);
    }

    @Post('unsubscribe')
    @Security('jwt', scopeArray)
    @Response<ErrorType>(401, 'ValidationError')
    @Response<ErrorType>(500, 'Unknown server error')
    public async unsubscribe(
        @Body() options: SubscribeOptions,
        @Request() request: ExRequest
    ) {
        // @ts-ignore
        const accessToken = request.user as jwtToken;
        return this.service.unsubscribe(options, accessToken.id);
    }
}
