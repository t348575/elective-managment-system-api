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
import {isBatchString} from '../../models/mongo/batch-repository';

export interface CreateUserCSV {
	defaultRollNoAsEmail: boolean
}

@Tags('users')
@Route('users')
@ProvideSingleton(UsersController)
export class UsersController extends Controller {

	private multerSingle = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50000000 } }).single('file');

	constructor(@inject(UsersService) private service: UsersService) {
		super();
	}

	@Get('basic')
	@Security('jwt', scopeArray)
	public async basic(
		@Request() request: ExRequest
	) {
		// @ts-ignore
		const jwtRefresh = request.accessToken as jwtToken;
		return remove<IUserModel, SafeUser>(await this.service.basic(jwtRefresh.id, jwtRefresh.scope), getSafeUserOmit(jwtRefresh.scope));
	}

	@Get('scope')
	@Security('jwt', scopeArray)
	public getScope(
		@Request() request: ExRequest
	) {
		// @ts-ignore
		const jwtRefresh = request.accessToken as jwtToken;
		return jwtRefresh.scope;
	}

	@Post('create')
	@Security('jwt', adminOnly)
	public async create(
		@Request() request: ExRequest
	) {
		// @ts-ignore
		const jwtRefresh = request.accessToken as jwtToken;
	}

	@Post('create-csv')
	@Security('jwt', adminOnly)
	@Response<ErrorType>(401, 'Form validation failed')
	@Response<ErrorType>(500, 'Unknown server error')
	@Response<DefaultSuccess>(200, 'Success')
	public createCSV(
		@Body() options: CreateUserCSV,
		@Request() request: ExRequest
	): Promise<DefaultSuccess> {
		return new Promise<DefaultSuccess>((resolve, reject) => {
			// @ts-ignore
			this.multerSingle(request, undefined, async (err: multer.MulterError | Error) => {
				try {
					if (err) {
						reject(new ApiError({ name: 'form_error', statusCode: 401, message: err?.message }));
					}
					else {
						if (request.file.originalname.indexOf('.csv') > -1) {
							const inputStream = new Readable();
							inputStream.push(request.file.buffer);
							inputStream.push(null);
							csv().fromStream(inputStream)
							.then(async (obj) => {
								const invalid: any[] = [];
								for (const [i, v] of obj.entries()) {
									if (
										checkString(v, 'role', teacherOrStudent) &&
										checkString(v, 'rollNo') &&
										checkString(v, 'name') &&
										checkString(v, 'batch') &&
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
												checkString(v, 'email')
											)
										)
									) {
										try {
											resolve({ status: true });
											/*
											if (await this.service.create(
												{
													name: v['name'],
													username: this.getEmail(v as IUserModel, options.defaultRollNoAsEmail)
												}
											)) {

											}
											else {

											}
											 */
										}
										catch (err) {
											invalid.push(v);
										}
									}
									else {
										invalid.push(v);
									}
								}
							});
							// resolve({ status: true, message: 'Added successfully' });
						}
						else {
							reject(new ApiError({ name: 'file_type', statusCode: 402, message: 'Improper file type'}))
						}
					}
				} catch (err) {
					reject(new ApiError({ name: 'unknown_error', statusCode: 500, message: err?.message }));
				}
			});
		});
	}

	private getEmail(obj: IUserModel, rollNoAsEmail: boolean): string {
		return '';
	}
}
