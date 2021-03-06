import {
	Body,
	Controller,
	Get,
	Path,
	Post,
	Query,
	Route,
	SuccessResponse,
	Security,
	Response,
	Put,
	Request,
	Tags
} from 'tsoa';
import express, {Request as ExRequest, Response as ExResponse} from 'express';
import csv from 'csvtojson';
import cryptoRandomString from 'crypto-random-string';
import {UsersService} from './service';
import {ProvideSingleton} from '../../shared/provide-singleton';
import {inject} from 'inversify';
import {adminOnly, DefaultSuccess, jwtToken, scopeArray, teacherOrStudent} from '../../models/types';
import {remove} from '../../util/base-formatter';
import {getSafeUserOmit, IUserModel, SafeUser} from '../../models/mongo/user-repository';
import multer from 'multer';
import {ApiError, ErrorType} from '../../shared/error-handler';
import {Readable} from 'stream';
import {checkString} from '../../util/general-util';
import {batchStringToModel, isBatchString} from '../../models/mongo/batch-repository';
import constants from '../../constants';
import {Logger} from '../../shared/logger';

interface CreateUserCSV {
	defaultRollNoAsEmail: boolean
}

interface CreateUserResponse {
	status: boolean;
	failed: any[];
}

@Tags('users')
@Route('users')
@ProvideSingleton(UsersController)
export class UsersController extends Controller {

	constructor(@inject(UsersService) private service: UsersService) {
		super();
	}

	@Get('basic')
	@Security('jwt', scopeArray)
	public async basic(
		@Request() request: ExRequest
	) {
		// @ts-ignore
		const jwtRefresh = request.user as jwtToken;
		return remove<IUserModel, SafeUser>(await this.service.basic(jwtRefresh.id, jwtRefresh.scope), getSafeUserOmit(jwtRefresh.scope));
	}

	@Get('scope')
	@Security('jwt', scopeArray)
	public getScope(
		@Request() request: ExRequest
	) {
		// @ts-ignore
		const jwtRefresh = request.user as jwtToken;
		return jwtRefresh.scope;
	}

	@Post('create')
	@Security('jwt', adminOnly)
	public async create(
		@Request() request: ExRequest
	) {
		// @ts-ignore
		const jwtRefresh = request.user as jwtToken;
	}

	@Post('create-csv')
	@Security('jwt', adminOnly)
	@Response<ErrorType>(401, 'Form validation failed')
	@Response<ErrorType>(500, 'Unknown server error')
	@Response<CreateUserResponse>(200, 'Success')
	public createCSV(
		@Body() options: CreateUserCSV,
		@Request() request: ExRequest
	): Promise<CreateUserResponse> {
		return new Promise<CreateUserResponse>((resolve, reject) => {
			// @ts-ignore
			/*this.multerSingle(request, undefined, async (err: multer.MulterError | Error) => {

			});*/
			try {
				if (request.file === undefined) {
					reject(new ApiError({ name: 'form_error', statusCode: 401, message: 'Not a valid multipart form' }));
				}
				else {
					if (request.file.originalname.indexOf('.csv') > -1) {
						const inputStream = new Readable();
						inputStream.push(request.file.buffer);
						inputStream.push(null);
						csv().fromStream(inputStream)
							.then(async (obj) => {
								const invalid: any[] = [];
								const mailList = [];
								for (const v of obj) {
									if (checkString(v, 'role', teacherOrStudent) &&
										checkString(v, 'rollNo') &&
										checkString(v, 'name') &&
										(
											v['role'] === 'teacher' ||
											(
												v['role'] === 'student' &&
												isBatchString(v['batch'])
											)
										) &&
										(

											options.defaultRollNoAsEmail ||
											(
												!options.defaultRollNoAsEmail &&
												checkString(v, 'username')
											)
										)) {
										try {
											const user = {
												name: v['name'],
												username: UsersController.getEmail(v as IUserModel, options.defaultRollNoAsEmail),
												password: cryptoRandomString({ length: 8, type: 'url-safe' }),
												rollNo: v['rollNo'],
												role: v['role'],
												batch: v['batch']
											};
											await this.service.create(user);
											mailList.push(user);
										}
										catch (err) {
											invalid.push(v);
										}
									}
									else {
										invalid.push(v);
									}
								}
								this.service.sendCreateEmails(mailList).then().catch(err => Logger.error(err));
								resolve({ status: true, failed: invalid });
							});
					}
					else {
						reject(new ApiError({ name: 'file_type', statusCode: 402, message: 'Improper file type'}))
					}
				}
			} catch (err) {
				reject(new ApiError({ name: 'unknown_error', statusCode: 500, message: err?.message }));
			}
		});
	}

	private static getEmail(obj: IUserModel, rollNoAsEmail: boolean): string {
		if (rollNoAsEmail) {
			if (checkString(obj, 'username')) {
				return obj['username'];
			}
			else {
				return obj['rollNo'] + '@' + (obj['role'] === 'student' ? constants.emailSuffix.student : constants.emailSuffix.teacher);
			}
		}
		return obj['username'];
	}
}
