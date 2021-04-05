import * as express from 'express';
import constants from '../constants';
import { ApiError, OAuthError } from './error-handler';
import { RedisConnector } from './redis-connector';
import { decipherJWT } from '../util/general-util';

const invalidRefreshToken = new OAuthError({
    name: 'invalid_request',
    error_description: 'Invalid refresh token'
});

const redis = new RedisConnector();
export function expressAuthentication(req: express.Request, securityName: string, scopes: string[]): Promise<any> {
    switch (securityName) {
        case 'userId':
        case 'jwtRefresh':
        case 'jwt': {
            const token = req.headers.authorization?.split(' ')[1];
            return new Promise((resolve, reject) => {
                if (!token) {
                    return reject(
                        new OAuthError({
                            name: 'invalid_request',
                            error_description: 'Authorization missing'
                        })
                    );
                }
                decipherJWT(token, 'accessToken')
                    .then(async (accessToken) => {
                        try {
                            if (scopes.indexOf(accessToken.scope) === -1) {
                                reject(
                                    new OAuthError({
                                        name: 'invalid_scope',
                                        error_description: 'JWT does not contain required scope'
                                    })
                                );
                            }
                            if (await redis.exists(`accessToken::${accessToken.id}::${accessToken.exp}`)) {
                                if (securityName === 'jwtRefresh') {
                                    if (
                                        // eslint-disable-next-line no-prototype-builtins
                                        req.body.hasOwnProperty('refresh_token') &&
                                        typeof req.body.refresh_token === 'string' &&
                                        req.body.refresh_token.length > 0
                                    ) {
                                        decipherJWT(req.body.refresh_token, 'refreshToken')
                                            .then(async (refreshToken) => {
                                                try {
                                                    if (scopes.indexOf(refreshToken.scope) === -1) {
                                                        reject(
                                                            new OAuthError({
                                                                name: 'invalid_scope',
                                                                error_description: 'JWT does not contain required scope'
                                                            })
                                                        );
                                                    }
                                                    if (
                                                        await redis.exists(
                                                            `refreshToken::${refreshToken.id}::${refreshToken.exp}`
                                                        )
                                                    ) {
                                                        // @ts-ignore
                                                        req.userRefresh = refreshToken;
                                                        resolve(accessToken);
                                                    } else {
                                                        reject(
                                                            new OAuthError({
                                                                name: 'access_denied',
                                                                error_description: 'Token does not exist'
                                                            })
                                                        );
                                                    }
                                                } catch (err) {
                                                    reject(
                                                        new OAuthError({
                                                            name: 'server_error',
                                                            error_description: err.message
                                                        })
                                                    );
                                                }
                                            })
                                            .catch(() => reject(invalidRefreshToken));
                                    } else {
                                        reject(
                                            new OAuthError({
                                                name: 'invalid_request',
                                                error_description: 'Refresh token is required'
                                            })
                                        );
                                    }
                                } else if (securityName === 'userId') {
                                    if (
                                        // eslint-disable-next-line no-prototype-builtins
                                        req.query.hasOwnProperty('id_token') &&
                                        typeof req.query.id_token === 'string' &&
                                        req.query.id_token.length > 0 &&
                                        // eslint-disable-next-line no-prototype-builtins
                                        req.query.hasOwnProperty('refresh_token') &&
                                        typeof req.query.refresh_token === 'string' &&
                                        req.query.refresh_token.length > 0
                                    ) {
                                        decipherJWT(req.query.id_token, 'idToken')
                                            .then(async (idToken) => {
                                                try {
                                                    if (scopes.indexOf(idToken.scope) === -1) {
                                                        reject(
                                                            new OAuthError({
                                                                name: 'invalid_scope',
                                                                error_description: 'JWT does not contain required scope'
                                                            })
                                                        );
                                                    }
                                                } catch (err) {
                                                    return reject(
                                                        new OAuthError({
                                                            name: 'server_error',
                                                            error_description: err.message
                                                        })
                                                    );
                                                }
                                                if (await redis.exists(`idToken::${idToken.id}::${idToken.exp}`)) {
                                                    // @ts-ignore
                                                    decipherJWT(req.query.refresh_token, 'refreshToken')
                                                        .then(async (refreshToken) => {
                                                            try {
                                                                if (scopes.indexOf(refreshToken.scope) === -1) {
                                                                    reject(
                                                                        new OAuthError({
                                                                            name: 'invalid_scope',
                                                                            error_description:
                                                                                'JWT does not contain required scope'
                                                                        })
                                                                    );
                                                                }
                                                                if (
                                                                    await redis.exists(
                                                                        `refreshToken::${refreshToken.id}::${refreshToken.exp}`
                                                                    )
                                                                ) {
                                                                    // @ts-ignore
                                                                    req.userRefresh = refreshToken;
                                                                    // @ts-ignore
                                                                    req.userId = idToken;
                                                                    resolve(accessToken);
                                                                } else {
                                                                    reject(
                                                                        new OAuthError({
                                                                            name: 'access_denied',
                                                                            error_description: 'Token does not exist'
                                                                        })
                                                                    );
                                                                }
                                                            } catch (err) {
                                                                return reject(
                                                                    new OAuthError({
                                                                        name: 'server_error',
                                                                        error_description: err.message
                                                                    })
                                                                );
                                                            }
                                                        })
                                                        .catch(() => reject(invalidRefreshToken));
                                                } else {
                                                    reject(
                                                        new OAuthError({
                                                            name: 'access_denied',
                                                            error_description: 'Token does not exist'
                                                        })
                                                    );
                                                }
                                            })
                                            .catch(() =>
                                                reject(
                                                    new OAuthError({
                                                        name: 'invalid_request',
                                                        error_description: 'Invalid id token'
                                                    })
                                                )
                                            );
                                    } else {
                                        reject(
                                            new OAuthError({
                                                name: 'invalid_request',
                                                error_description: 'Id token and Refresh token is required'
                                            })
                                        );
                                    }
                                } else {
                                    resolve(accessToken);
                                }
                            } else {
                                reject(
                                    new OAuthError({
                                        name: 'access_denied',
                                        error_description: 'Token does not exist'
                                    })
                                );
                            }
                        } catch (err) {
                            reject(
                                new OAuthError({
                                    name: 'server_error',
                                    error_description: err.message
                                })
                            );
                        }
                    })
                    .catch(() => {
                        reject(
                            new OAuthError({
                                name: 'invalid_request',
                                error_description: 'Invalid token'
                            })
                        );
                    });
            });
        }
        case 'any': {
            const token = req.headers.authorization?.split(' ')[1];
            return new Promise((resolve, reject) => {
                if (!token) {
                    return reject(
                        new OAuthError({
                            name: 'invalid_request',
                            error_description: 'Authorization missing'
                        })
                    );
                }
                decipherJWT(token, 'accessToken')
                    .then(async (accessToken) => {
                        if (await redis.exists(`accessToken::${accessToken.id}::${accessToken.exp}`)) {
                            resolve(accessToken);
                        } else {
                            reject(
                                new OAuthError({
                                    name: 'access_denied',
                                    error_description: 'Token does not exist'
                                })
                            );
                        }
                    })
                    .catch(() => {
                        reject(
                            new OAuthError({
                                name: 'invalid_request',
                                error_description: 'Invalid token'
                            })
                        );
                    });
            });
        }
        default: {
            return Promise.reject(new ApiError(constants.errorTypes.auth));
        }
    }
}
