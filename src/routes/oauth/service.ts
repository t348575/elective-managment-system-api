import {inject} from 'inversify';
import * as argon2 from 'argon2';
import {IUserModel, UserRepository} from '../../models/mongo/user-repository';
import express, {Request as ExRequest, Response as ExResponse} from 'express';
import {ProvideSingleton} from '../../shared/provide-singleton';
import {IAuthTokenRequest} from '../../models/basic/auth';
import {BaseService} from '../../models/shared/base-service';
import {OAuthError} from '../../shared/error-handler';
import {decipherJWT, getJWT, getSHA256, urlSafe} from '../../util/general-util';
import constants from '../../constants';
import {RedisConnector} from '../../shared/redis-connector';
import {jwtToken, refreshTokenResponse, scopes, tokenResponse} from '../../models/types';
import * as qs from 'querystring';
import {Logger} from '../../shared/logger';
@ProvideSingleton(AuthService)
export class AuthService extends BaseService <IAuthTokenRequest> {

	constructor(
		@inject(UserRepository) protected repository: UserRepository,
		@inject(RedisConnector) protected redis: RedisConnector
	) {
		super();
	}
	authorize(username: string, password: string, code_challenge: string, state: string, redirectUri: string, clientId: string, scope: scopes, response: ExResponse): Promise<null> {
		return new Promise<null>((resolve, reject) => {
			this.repository.findOne({ username: username })
			.then(user => {
				if (user.role === scope) {
					argon2.verify(user.password, password)
					.then(passwordState => {
						try {
							if (passwordState) {
								getJWT(user, state.slice(0, 8), constants.jwtExpiry.oneTimeAuthCodeExpiry, 'oneTimeAuthCode', scope)
									.then(jwt => {
										this.redis.setex(`oneTimeAuthCode::${user.id}::${state.slice(0, 8)}`, jwt.expiry, `${jwt.jwt}::${urlSafe(code_challenge)}::${urlSafe(redirectUri)}`)
											.then(status => {
												if (status) {
													if (clientId === 'site') {
														response.status(200);
														response.json({code:jwt.jwt});
														resolve(null);
													}
													else {
														response.redirect(redirectUri + '?' + qs.stringify({code: jwt.jwt}));
														resolve(null);
													}
												}
												else {
													return reject(new OAuthError({ name: 'access_denied', error_description: 'Username or password incorrect' }));
												}
											})
											.catch(err => {
												reject(new OAuthError({ name: 'server_error', error_description: err?.message }))
											});
									})
									.catch(err => {
										return reject(new OAuthError({ name: 'server_error', error_description: err?.message }));
									});
							}
							else {
								return reject(new OAuthError({ name: 'access_denied', error_description: 'Username or password incorrect' }));
							}
						} catch (err) {
							reject(new OAuthError({ name: 'server_error', error_description: err?.message }));
						}
					})
					.catch(err => {
						return reject(new OAuthError({ name: 'access_denied', error_description: 'User does not exist' }));
					});
				}
				else {
					return reject(new OAuthError({ name: 'invalid_scope', error_description: 'Login id does not have access to requested scope' }));
				}
			})
			.catch(err => {
				if (err.statusCode === 404) {
					return reject(new OAuthError({ name: 'access_denied', error_description: 'User does not exist' }));
				}
				reject(new OAuthError({ name: 'server_error', error_description: err?.message }));
			});
		});
	}

	autoLogin(idToken: string, code_challenge: string, state: string, redirectUri: string, clientId: string, scope: scopes, response: ExResponse): Promise<null> {
		return new Promise<null>((resolve, reject) => {
			decipherJWT(idToken, 'idToken')
			.then(decodedIdToken => {
				this.repository.getById(decodedIdToken.id)
				.then(user => {
					if (user.role === scope) {
						getJWT(user, state.slice(0, 8), constants.jwtExpiry.oneTimeAuthCodeExpiry, 'oneTimeAuthCode', scope)
							.then(jwt => {
								this.redis.setex(`oneTimeAuthCode::${user.id}::${state.slice(0, 8)}`, jwt.expiry, `${jwt.jwt}::${urlSafe(code_challenge)}::${urlSafe(redirectUri)}`)
									.then(status => {
										if (status) {
											if (clientId === 'site') {
												response.status(200);
												response.json({code:jwt.jwt});
												resolve(null);
											}
											else {
												response.redirect(redirectUri + '?' + qs.stringify({code: jwt.jwt}));
												resolve(null);
											}
										}
										else {
											return reject(new OAuthError({ name: 'access_denied', error_description: 'User does not exist' }));
										}
									})
									.catch(err => {
										reject(new OAuthError({ name: 'server_error', error_description: err?.message }))
									});
							})
							.catch(err => {
								return reject(new OAuthError({ name: 'server_error', error_description: err?.message }));
							});
					}
					else {
						return reject(new OAuthError({ name: 'invalid_scope', error_description: 'Login id does not have access to requested scope' }));
					}
				})
				.catch(err => reject(new OAuthError({ name: 'server_error', error_description: err.message })));
			})
			.catch(err => reject(new OAuthError({ name: 'invalid_request', error_description: 'Invalid idToken' })));
		});
	}

	getToken(code: string, codeVerifier: string): Promise<tokenResponse> {
		return new Promise<tokenResponse>((resolve, reject) => {
			decipherJWT(code, 'oneTimeAuthCode')
			.then((jwtObject: jwtToken) => {
				this.redis.db.get(`oneTimeAuthCode::${jwtObject.id}::${jwtObject.stateSlice}`, (err, reply) => {
					try {
						if (err) {
							reject(new OAuthError({ name: 'server_error', error_description: err?.message }));
						}
						else if (reply) {
							const [storedCode, codeChallenge] = reply.split('::');
							if (code === storedCode && getSHA256(codeVerifier) === codeChallenge) {
								this.generateTokens(jwtObject.id, jwtObject.stateSlice, jwtObject.scope)
									.then(tokens => {
										resolve({ ...tokens });
									})
									.catch(err => reject(new OAuthError({ name: 'server_error', error_description: err?.message })));
							}
							else {
								reject(new OAuthError({ name: 'access_denied', error_description: 'Code challenge or code could not be verified' }));
							}
						}
						else {
							reject(new OAuthError({ name: 'server_error', error_description: 'An unknown error' }));
						}
					} catch (err) {
						reject(new OAuthError({ name: 'server_error', error_description: err?.message }));
					}
				});
			})
			.catch(err => reject(new OAuthError({ name: 'access_denied', error_description: err?.message })));
		});
	}

	private generateTokens(id: string, state: string, scope: scopes): Promise<tokenResponse> {
		return new Promise<tokenResponse>((resolve, reject) => {
			this.repository.getById(id)
			.then(async (user) => {
				try {
					const idToken = await getJWT(user, state, constants.jwtExpiry.idExpiry, 'idToken', scope);
					const accessToken = await getJWT(user, state, constants.jwtExpiry.accessExpiry, 'accessToken', scope);
					const refreshToken = await getJWT(user, state, constants.jwtExpiry.refreshExpiry, 'refreshToken', scope);
					await this.redis.setex(`idToken::${id}::${idToken.expiry}`, idToken.expiry, idToken.jwt);
					await this.redis.setex(`accessToken::${id}::${accessToken.expiry}`, accessToken.expiry, accessToken.jwt);
					await this.redis.setex(`refreshToken::${id}::${refreshToken.expiry}`, refreshToken.expiry, refreshToken.jwt);
					resolve({ id_token: idToken.jwt, access_token: accessToken.jwt, refresh_token: refreshToken.jwt });
				} catch(err) {
					reject(err);
				}
			})
			.catch(err => reject(err));
		});
	}

	public newRefreshToken(jwtAccess: jwtToken, jwtRefresh: jwtToken): Promise<refreshTokenResponse> {
		return new Promise<refreshTokenResponse>((resolve, reject) => {
			this.repository.getById(jwtAccess.id)
			.then(async (user) => {
				try {
					const accessToken = await getJWT(user, jwtAccess.stateSlice, constants.jwtExpiry.accessExpiry, 'accessToken', jwtAccess.scope);
					const refreshToken = await getJWT(user, jwtAccess.stateSlice, constants.jwtExpiry.refreshExpiry, 'refreshToken', jwtAccess.scope);
					await this.redis.remove(`accessToken::${jwtAccess.id}::${jwtAccess.exp}`);
					await this.redis.remove(`refreshToken::${jwtAccess.id}::${jwtRefresh.exp}`);
					await this.redis.setex(`accessToken::${jwtAccess.id}::${accessToken.expiry}`, accessToken.expiry, accessToken.jwt);
					await this.redis.setex(`refreshToken::${jwtAccess.id}::${refreshToken.expiry}`, refreshToken.expiry, refreshToken.jwt);
					resolve({ access_token: accessToken.jwt, refresh_token: refreshToken.jwt });
				} catch(err) {
					reject(err);
				}
			})
			.catch(err => reject(err));
		});
	}

	public logout(jwtAccess: jwtToken, jwtId: jwtToken, jwtRefresh: jwtToken, response: ExResponse): Promise<null> {
		return new Promise<null>((resolve, reject) => {
			this.repository.getById(jwtAccess.id)
			.then(async (user) => {
				try {
					await this.redis.remove(`accessToken::${jwtAccess.id}::${jwtAccess.exp}`);
					await this.redis.remove(`refreshToken::${jwtAccess.id}::${jwtRefresh.exp}`);
					await this.redis.remove(`idToken::${jwtAccess.id}::${jwtId.exp}`);
					response.redirect(constants.baseUrl);
					resolve(null);
				} catch(err) {
					reject(err);
				}
			})
			.catch(err => reject(err));
		});
	}
}
