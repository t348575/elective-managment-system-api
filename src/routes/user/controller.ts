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
import {UsersService} from './service';
import {ProvideSingleton} from '../../shared/provide-singleton';
import {inject} from 'inversify';
import {jwtToken} from '../../models/types';
import {remove} from '../../util/base-formatter';
import {getSafeUserOmit, IUserModel, SafeUser, UserFormatter} from '../../models/mongo/user-repository';
import {ApiError, ErrorType} from '../../shared/error-handler';
import {Readable} from 'stream';

export interface CreateUserCSV {
	defaultRollNoAsEmail: boolean
}

interface CreateUserResponse {
	status: boolean;
	failed: any[];
}

const scopeArray: string[] = ['teacher', 'admin', 'student'];

const adminOnly: string[] = ['admin'];

const teacherOrStudent: string[] = ['student', 'teacher'];

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
		const accessToken = request.user as jwtToken;
		return remove<IUserModel, SafeUser>(await this.service.basic(accessToken.id, accessToken.scope), getSafeUserOmit(accessToken.scope));
	}

	@Get('scope')
	@Security('jwt', scopeArray)
	public getScope(
		@Request() request: ExRequest
	) {
		// @ts-ignore
		const accessToken = request.user as jwtToken;
		return accessToken.scope;
	}

	/*@Post('create')
	@Security('jwt', adminOnly)
	public async create(
		@Request() request: ExRequest
	): Promise<CreateUserResponse> {
		// @ts-ignore
		const accessToken = request.user as jwtToken;
	}*/

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
							resolve({ status: true, failed: await this.service.createUsers(obj, options) });
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
}
