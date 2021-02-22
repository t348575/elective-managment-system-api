import {Body, Controller, Get, Post, Query, Route, Tags, Response, Request, Hidden, Security, BodyProp} from 'tsoa';
import express, {Request as ExRequest, Response as ExResponse} from 'express';
import {ProvideSingleton} from '../../shared/provide-singleton';
import {inject} from 'inversify';
import {AuthService} from './service';
import * as fs from 'fs';
import * as path from 'path';
import {
	jwtToken,
	logoutToken,
	refreshToken,
	scopeArray,
	scopes,
	tokenBodyType,
	tokenResponse
} from '../../models/types';
import {OAuthError} from '../../shared/error-handler';
import * as qs from 'querystring';

type acceptedChallengeMethods = 'S256';
type clientIds = 'api' | 'site';
type responseTypes = 'code'

@Tags('oauth')
@Route('oauth')
@ProvideSingleton(AuthController)
export class AuthController extends Controller {
	constructor(
		@inject(AuthService) private service: AuthService
	) {
		super();
	}

	@Get('authorize')
	public async auth(
		@Query('response_type') responseType: responseTypes,
		@Query('client_id') clientId: clientIds,
		@Query('redirect_uri') redirectUri: string,
		@Query('scope') scope: scopes,
		@Query('state') state: string,
		@Request() request: ExRequest,
		@Query() username: string,
		@Query() password: string,
		@Query('code_challenge') codeChallenge: string,
		@Query('code_challenge_method') codeChallengeMethod: acceptedChallengeMethods,
		@Query('id_token') idToken ?: string
	) {
		if (username && password && codeChallenge) {
			return this.service.authorize(username, password, codeChallenge, state, redirectUri, clientId, scope, (<any>request).res as ExResponse);
		}
		else if (idToken && codeChallenge) {
			return this.service.autoLogin(idToken, codeChallenge, state, redirectUri, clientId, scope, (<any>request).res as ExResponse);
		}
		else {
			throw new OAuthError({ name: 'invalid_request', error_description: 'Invalid parameters' });
		}
	}

	@Hidden()
	@Get('login')
	public async login(
		@Request() request: ExRequest
	) {
		const response = (<any>request).res as ExResponse;
		return new Promise<null>((resolve, reject) => {
			fs.readFile(path.resolve(__dirname, './../../../resources/public/login.html'), (err, data) => {
				if (err) {
					this.setStatus(500);
					response.end();
					reject();
				}
				else {
					this.setStatus(200);
					response.contentType('text/html');
					response.send(data.toString());
					resolve(null);
				}
			});
		});
	}

	@Post('token')
	public async token(
		@Body() body: tokenBodyType,
	) {
		return this.service.getToken(body.code, body.code_verifier);
	}

	@Security('jwtRefresh', scopeArray)
	@Post('refresh')
	public async refresh(
		@Body() body: refreshToken,
		@Request() request: ExRequest
	) {
		// @ts-ignore
		const jwtAccess = request.user as jwtToken;
		// @ts-ignore
		const jwtRefresh = request.userRefresh as jwtToken;
		return this.service.newRefreshToken(jwtAccess, jwtRefresh);
	}

	@Security('userId', scopeArray)
	@Get('logout')
	public async logout(
		@Query() refresh_token: string,
		@Query() id_token: string,
		@Request() request: ExRequest
	) {
		// @ts-ignore
		const jwtAccess = request.user as jwtToken;
		// @ts-ignore
		const jwtId = request.userId as jwtToken;
		// @ts-ignore
		const jwtRefresh = request.userRefresh as jwtToken;
		const response = (<any>request).res as ExResponse;
		return this.service.logout(jwtAccess, jwtId, jwtRefresh, response);
	}
}
