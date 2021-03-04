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
	Request,
	Tags
} from 'tsoa';
import express, {Request as ExRequest, Response as ExResponse} from 'express';
import {UsersService} from './service';
import {ProvideSingleton} from '../../shared/provide-singleton';
import {inject} from 'inversify';
import {id, jwtToken, scopeArray} from '../../models/types';
import {remove} from '../../util/base-formatter';
import {getSafeUserOmit, IUserModel, SafeUser} from '../../models/mongo/user-repository';


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
}
