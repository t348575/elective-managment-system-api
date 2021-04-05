import { Body, Controller, Get, Post, Query, Route, Security, Response, Put, Request, Delete, Tags } from 'tsoa';
import { Request as ExRequest } from 'express';
import csv from 'csvtojson';
import { UsersService } from './service';
import { DefaultActionResponse, DefaultResponse, jwtToken } from '../../models/types';
import { remove } from '../../util/base-formatter';
import { getSafeUserOmit, IUserModel, SafeUser } from '../../models/mongo/user-repository';
import { ApiError, ErrorType, UnknownApiError } from '../../shared/error-handler';
import { Readable } from 'stream';
import * as argon2 from 'argon2';
import { Inject, Singleton } from 'typescript-ioc';

export interface CreateUserCSV {
    defaultRollNoAsEmail: boolean;
}

export interface CreateUser {
    users: {
        name: string;
        username?: string;
        rollNo: string;
        role: 'admin' | 'teacher' | 'student';
        batch?: string;
    }[];
    defaultRollNoAsEmail: boolean;
}

export interface UpdateUser {
    name?: string;
    password?: string;
    rollNo: string;
    /**
     * Batch string
     * @pattern ^\d{4}-\d-[a-zA-Z]{4,5}-[a-zA-Z]{3,4}$
     * @example "2018-4-BTECH-CSE"
     */
    batch?: string;
}

interface UpdatePasswordRequest {
    oldPassword: string;
    newPassword: string;
}

export interface ResetPasswordRequest {
    password: string;
    code: string;
}

const scopeArray: string[] = ['teacher', 'admin', 'student'];

const adminOnly: string[] = ['admin'];
@Tags('users')
@Route('users')
@Singleton
export class UsersController extends Controller {
    @Inject
    private service: UsersService;
    constructor() {
        super();
    }

    @Get('basic')
    @Security('jwt', scopeArray)
    public async basic(@Request() request: ExRequest) {
        // @ts-ignore
        const accessToken = request.user as jwtToken;
        return remove<IUserModel, SafeUser>(
            await this.service.basic(accessToken.id, accessToken.scope),
            getSafeUserOmit(accessToken.scope)
        );
    }

    @Get('scope')
    @Security('jwt', scopeArray)
    public getScope(@Request() request: ExRequest) {
        // @ts-ignore
        const accessToken = request.user as jwtToken;
        return accessToken.scope;
    }

    @Post('create')
    @Security('jwt', adminOnly)
    @Response<ErrorType>(401, 'ValidationError')
    @Response<ErrorType>(500, 'Unknown server error')
    @Response<DefaultActionResponse>(200, 'Success')
    public async create(@Body() options: CreateUser): Promise<DefaultActionResponse> {
        return new Promise<DefaultActionResponse>(async (resolve, reject) => {
            try {
                if (options.users.length > 0) {
                    resolve({
                        status: true,
                        failed: await this.service.createUsers(options.users, {
                            defaultRollNoAsEmail: options.defaultRollNoAsEmail
                        })
                    });
                } else {
                    reject(
                        new ApiError({
                            name: 'empty_array',
                            statusCode: 401,
                            message: 'Empty users array provided'
                        })
                    );
                }
            } catch (err) {
                reject(UnknownApiError(err));
            }
        });
    }

    @Post('create-csv')
    @Security('jwt', adminOnly)
    @Response<ErrorType>(401, 'ValidationError')
    @Response<ErrorType>(500, 'Unknown server error')
    @Response<DefaultActionResponse>(200, 'Success')
    public createCSV(@Body() options: CreateUserCSV, @Request() request: ExRequest): Promise<DefaultActionResponse> {
        return new Promise<DefaultActionResponse>((resolve, reject) => {
            try {
                if (request.file === undefined) {
                    reject(
                        new ApiError({
                            name: 'form_error',
                            statusCode: 401,
                            message: 'Not a valid multipart form'
                        })
                    );
                } else {
                    if (request.file.originalname.indexOf('.csv') > -1) {
                        const inputStream = new Readable();
                        inputStream.push(request.file.buffer);
                        inputStream.push(null);
                        csv()
                            .fromStream(inputStream)
                            .then(async (obj) => {
                                resolve({
                                    status: true,
                                    failed: await this.service.createUsers(obj, options)
                                });
                            });
                    } else {
                        reject(
                            new ApiError({
                                name: 'file_type',
                                statusCode: 402,
                                message: 'Improper file type'
                            })
                        );
                    }
                }
            } catch (err) {
                reject(UnknownApiError(err));
            }
        });
    }

    @Put('update')
    @Security('jwt', adminOnly)
    @Response<ErrorType>(401, 'ValidationError')
    @Response<ErrorType>(500, 'Unknown server error')
    @Response<DefaultActionResponse>(200, 'Success')
    public updateUser(@Body() options: UpdateUser[]) {
        return new Promise<DefaultActionResponse>(async (resolve, reject) => {
            try {
                resolve({
                    status: true,
                    failed: await this.service.updateUser(options)
                });
            } catch (err) {
                reject(UnknownApiError(err));
            }
        });
    }

    @Delete('delete')
    @Security('jwt', adminOnly)
    @Response<ErrorType>(401, 'ValidationError')
    @Response<ErrorType>(500, 'Unknown server error')
    @Response<DefaultActionResponse>(200, 'Success')
    public delete(@Body() users: string[]) {
        return new Promise<DefaultActionResponse>(async (resolve, reject) => {
            try {
                resolve({
                    status: true,
                    failed: await this.service.deleteUsers(users)
                });
            } catch (err) {
                reject(UnknownApiError(err));
            }
        });
    }

    @Get('user-by-roll-no')
    @Security('jwt', adminOnly)
    @Response<ErrorType>(401, 'ValidationError')
    @Response<ErrorType>(500, 'Unknown server error')
    @Response<DefaultActionResponse>(200, 'Success')
    public async getUserByRollNo(@Query('rollNo') rollNo: string) {
        return remove<IUserModel, SafeUser>(await this.service.getByRollNo(rollNo), ['password']);
    }

    @Put('changePassword')
    @Security('jwt', scopeArray)
    @Response<ErrorType>(401, 'ValidationError')
    @Response<ErrorType>(500, 'Unknown server error')
    @Response<DefaultResponse>(200, 'Success')
    public changePassword(
        @Body() options: UpdatePasswordRequest,
        @Request() request: ExRequest
    ): Promise<DefaultResponse> {
        // @ts-ignore
        const accessToken = request.user as jwtToken;
        return new Promise<DefaultResponse>((resolve, reject) => {
            this.service
                .getById(accessToken.id)
                .then((user) => {
                    argon2
                        .verify(user.password, options.oldPassword)
                        .then(async (oldPassStatus) => {
                            if (oldPassStatus) {
                                try {
                                    await this.service.updatePass(accessToken.id, options.newPassword);
                                    resolve({ status: true, message: 'success' });
                                } catch (err) {
                                    reject(UnknownApiError(err));
                                }
                            } else {
                                resolve({ status: false, message: 'old_pass_mismatch' });
                            }
                        })
                        .catch(() => resolve({ status: false, message: 'old_pass_mismatch' }));
                })
                .catch((err) => reject(UnknownApiError(err)));
        });
    }

    @Put('requestReset')
    @Response<ErrorType>(401, 'ValidationError')
    @Response<ErrorType>(500, 'Unknown server error')
    @Response<DefaultResponse>(200, 'Success')
    public async requestReset(@Body() user: { user: string }) {
        return this.service.requestReset(user.user);
    }

    @Get('validReset')
    @Response<ErrorType>(401, 'ValidationError')
    @Response<ErrorType>(500, 'Unknown server error')
    @Response<DefaultResponse>(200, 'Success')
    public async validReset(@Query() code: string) {
        try {
            const exists = await this.service.validReset(code);
            if (exists) {
                return { status: true, message: 'exists' };
            } else {
                return { status: false, message: 'no_exist' };
            }
        } catch (err) {
            if (err.statusCode === 404) {
                return { status: false, message: 'no_exist' };
            } else {
                throw UnknownApiError(err);
            }
        }
    }

    @Put('resetPassword')
    @Response<ErrorType>(401, 'ValidationError')
    @Response<ErrorType>(500, 'Unknown server error')
    @Response<DefaultResponse>(200, 'Success')
    public async resetPass(@Body() options: ResetPasswordRequest) {
        return this.service.resetPassword(options);
    }
}
