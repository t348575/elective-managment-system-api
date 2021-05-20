import { UnitHelper } from '../../unit-helper';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const unitHelper = new UnitHelper();
import { Container } from 'typescript-ioc';
import { RedisConnector } from '../../../shared/redis-connector';
import { MockRedisConnector } from '../../mocks/mock-redis-connector';
import { getJWT } from '../../../util/general-util';
import constants from '../../../constants';
import { IUserModel } from '../../../models/mongo/user-repository';
import { jwtToken, scopes } from '../../../models/types';
import {
    expressAuthentication,
    invalidToken,
    jwtDoesNotContainScope,
    tokenNoExist
} from '../../../shared/authentication-module';
import * as express from 'express';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);

describe('Authentication middleware', () => {
    before(() => {
        Container.bind(RedisConnector).to(MockRedisConnector);
    });
    afterEach(() => {
        ((Container.get(RedisConnector) as never) as MockRedisConnector).cleanup();
    });
    describe('jwt', () => {
        it('Should authenticate jwt', async () => {
            const tokens = await setupLoginJWTs(Container.get(RedisConnector), 'user_1');
            const res: jwtToken = await expressAuthentication(
                ({
                    headers: {
                        authorization: `Bearer ${tokens.access_token}`
                    }
                } as never) as express.Request,
                'jwt',
                ['admin']
            );
            expect(res.id).to.equal('user_1');
            expect(res.scope).to.equal('admin');
            expect(res.stateSlice).to.equal('abcdefghi');
            expect(res.sub).to.equal('accessToken');
        });

        it('Should handle incorrect scope jwt', async () => {
            const tokens = await setupLoginJWTs(Container.get(RedisConnector), 'user_1');
            try {
                await expressAuthentication(
                    ({
                        headers: {
                            authorization: `Bearer ${tokens.access_token}`
                        }
                    } as never) as express.Request,
                    'jwt',
                    ['student']
                );
                expect.fail('Expected an error');
            } catch (err) {
                expect(err.error_description).to.equal(jwtDoesNotContainScope);
            }
        });

        it('Should handle missing authorization', async () => {
            try {
                await expressAuthentication(({ headers: {} } as never) as express.Request, 'jwt', ['admin']);
                expect.fail('Expected an error');
            } catch (err) {
                expect(err.error_description).to.equal('Authorization missing');
            }
        });

        it('Should handle incorrect securityName', async () => {
            try {
                await expressAuthentication(({ headers: {} } as never) as express.Request, 'asd', ['admin']);
                expect.fail('Expected an error');
            } catch (err) {
                expect(err.name).to.equal('Unauthorized');
            }
        });

        it('Should handle nonexistent token', async () => {
            const temp = constants.jwtExpiry.accessExpiry;
            constants.jwtExpiry.accessExpiry = 1;
            const tokens = await setupLoginJWTs(Container.get(RedisConnector), 'user_1');
            await new Promise<void>((resolve) => {
                setTimeout(() => resolve(), 1050);
            });
            try {
                await expressAuthentication(
                    ({
                        headers: {
                            authorization: `Bearer ${tokens.access_token}`
                        }
                    } as never) as express.Request,
                    'jwt',
                    ['admin']
                );
                expect.fail('Expected an error');
            } catch (err) {
                expect(err.error_description).to.equal(tokenNoExist);
            }
            constants.jwtExpiry.accessExpiry = temp;
        });

        it('Should reject invalid token', async () => {
            try {
                await expressAuthentication(
                    ({
                        headers: {
                            authorization: 'Bearer some_invalid_token'
                        }
                    } as never) as express.Request,
                    'jwt',
                    ['admin']
                );
                expect.fail('Expected an error');
            } catch (err) {
                expect(err.error_description).to.equal('Invalid token');
            }
        });
    });

    describe('jwtRefresh', () => {
        it('Should handle jwtRefresh', async () => {
            const tokens = await setupLoginJWTs(Container.get(RedisConnector), 'user_1');
            const req = {
                headers: {
                    authorization: `Bearer ${tokens.access_token}`
                },
                body: {
                    refresh_token: tokens.refresh_token
                }
            };
            const res: jwtToken = await expressAuthentication((req as never) as express.Request, 'jwtRefresh', [
                'admin'
            ]);
            expect(res.id).to.equal('user_1');
            expect(res.scope).to.equal('admin');
            expect(res.stateSlice).to.equal('abcdefghi');
            expect(res.sub).to.equal('accessToken');
            expect(req).to.have.property('userRefresh');
            // @ts-ignore
            const userRefresh = req.userRefresh as jwtToken;
            expect(userRefresh.id).to.equal('user_1');
            expect(userRefresh.sub).to.equal('refreshToken');
        });

        it('Should handle invalid empty token', async () => {
            const tokens = await setupLoginJWTs(Container.get(RedisConnector), 'user_1');
            const req = {
                headers: {
                    authorization: `Bearer ${tokens.access_token}`
                },
                body: {
                    refresh_token: ''
                }
            };
            try {
                await expressAuthentication((req as never) as express.Request, 'jwtRefresh', ['admin']);
                expect.fail('Expected an error');
            } catch (err) {
                expect(err.error_description).to.equal('Refresh token is required');
            }
        });

        it('Should handle invalid jwtRefresh token', async () => {
            const tokens = await setupLoginJWTs(Container.get(RedisConnector), 'user_1');
            const req = {
                headers: {
                    authorization: `Bearer ${tokens.access_token}`
                },
                body: {
                    refresh_token: 'asd'
                }
            };
            try {
                await expressAuthentication((req as never) as express.Request, 'jwtRefresh', ['admin']);
                expect.fail('Expected an error');
            } catch (err) {
                expect(err.error_description).to.equal('Invalid refresh token');
            }
        });

        it('Should handle invalid jwtRefresh scope', async () => {
            const tokens = await setupLoginJWTs(Container.get(RedisConnector), 'user_1', ['admin', 'student', 'admin']);
            const req = {
                headers: {
                    authorization: `Bearer ${tokens.access_token}`
                },
                body: {
                    refresh_token: tokens.refresh_token
                }
            };
            try {
                await expressAuthentication((req as never) as express.Request, 'jwtRefresh', ['admin']);
                expect.fail('Expected an error');
            } catch (err) {
                expect(err.error_description).to.equal(jwtDoesNotContainScope);
            }
        });

        it('Should handle nonexistent jwtRefresh token', async () => {
            const temp = constants.jwtExpiry.refreshExpiry;
            constants.jwtExpiry.refreshExpiry = 1;
            const tokens = await setupLoginJWTs(Container.get(RedisConnector), 'user_1');
            await new Promise<void>((resolve) => {
                setTimeout(() => resolve(), 1050);
            });
            try {
                await expressAuthentication(
                    ({
                        headers: {
                            authorization: `Bearer ${tokens.access_token}`
                        },
                        body: {
                            refresh_token: tokens.refresh_token
                        }
                    } as never) as express.Request,
                    'jwtRefresh',
                    ['admin']
                );
                expect.fail('Expected an error');
            } catch (err) {
                expect(err.error_description).to.equal(tokenNoExist);
            }
            constants.jwtExpiry.refreshExpiry = temp;
        });
    });

    describe('userId', () => {
        it('Should handle userId', async () => {
            const tokens = await setupLoginJWTs(Container.get(RedisConnector), 'user_1');
            const req = {
                headers: {
                    authorization: `Bearer ${tokens.access_token}`
                },
                query: {
                    refresh_token: tokens.refresh_token,
                    id_token: tokens.id_token
                }
            };
            const res: jwtToken = await expressAuthentication((req as never) as express.Request, 'userId', ['admin']);
            expect(res.id).to.equal('user_1');
            expect(res.scope).to.equal('admin');
            expect(res.stateSlice).to.equal('abcdefghi');
            expect(res.sub).to.equal('accessToken');
            expect(req).to.have.property('userRefresh');
            // @ts-ignore
            const userRefresh = req.userRefresh as jwtToken;
            expect(userRefresh.id).to.equal('user_1');
            expect(userRefresh.sub).to.equal('refreshToken');
        });

        it('Should handle invalid empty token', async () => {
            const tokens = await setupLoginJWTs(Container.get(RedisConnector), 'user_1');
            const req = {
                headers: {
                    authorization: `Bearer ${tokens.access_token}`
                },
                query: {
                    refresh_token: '',
                    id_token: tokens.id_token
                }
            };
            try {
                await expressAuthentication((req as never) as express.Request, 'userId', ['admin']);
                expect.fail('Expected an error');
            } catch (err) {
                expect(err.error_description).to.equal('Id token and Refresh token is required');
            }
        });

        it('Should handle invalid userId token', async () => {
            const tokens = await setupLoginJWTs(Container.get(RedisConnector), 'user_1');
            const req = {
                headers: {
                    authorization: `Bearer ${tokens.access_token}`
                },
                query: {
                    refresh_token: 'asd',
                    id_token: tokens.id_token
                }
            };
            try {
                await expressAuthentication((req as never) as express.Request, 'userId', ['admin']);
                expect.fail('Expected an error');
            } catch (err) {
                expect(err.error_description).to.equal('Invalid refresh token');
            }
        });

        it('Should handle invalid userId scope', async () => {
            const tokens = await setupLoginJWTs(Container.get(RedisConnector), 'user_1', ['admin', 'student', 'admin']);
            const req = {
                headers: {
                    authorization: `Bearer ${tokens.access_token}`
                },
                query: {
                    refresh_token: tokens.refresh_token,
                    id_token: tokens.id_token
                }
            };
            try {
                await expressAuthentication((req as never) as express.Request, 'userId', ['admin']);
                expect.fail('Expected an error');
            } catch (err) {
                expect(err.error_description).to.equal(jwtDoesNotContainScope);
            }
        });

        it('Should handle nonexistent userId token', async () => {
            const temp = constants.jwtExpiry.idExpiry;
            constants.jwtExpiry.idExpiry = 1;
            const tokens = await setupLoginJWTs(Container.get(RedisConnector), 'user_1');
            await new Promise<void>((resolve) => {
                setTimeout(() => resolve(), 1050);
            });
            try {
                await expressAuthentication(
                    ({
                        headers: {
                            authorization: `Bearer ${tokens.access_token}`
                        },
                        query: {
                            refresh_token: tokens.refresh_token,
                            id_token: tokens.id_token
                        }
                    } as never) as express.Request,
                    'userId',
                    ['admin']
                );
                expect.fail('Expected an error');
            } catch (err) {
                expect(err.error_description).to.equal(tokenNoExist);
            }
            constants.jwtExpiry.idExpiry = temp;
        });
    });

    describe('quiz', () => {
        it('Should create quiz tokens', async () => {
            const tokens = await setupLoginJWTs(Container.get(RedisConnector), 'user_1', [
                'student',
                'student',
                'student'
            ]);
            const quizToken = await getJWT(
                ({ id: 'user_1' } as never) as IUserModel,
                'abcdefghi',
                constants.jwtExpiry.refreshExpiry,
                'quiz',
                'student'
            );
            await Container.get(RedisConnector).setex(
                `quiz::user_1::${quizToken.expiry}`,
                constants.jwtExpiry.idExpiry,
                quizToken.jwt
            );
            const req = {
                headers: {
                    authorization: `Bearer ${tokens.access_token}`,
                    quizrequest: `Bearer ${quizToken.jwt}`
                }
            };
            const res: jwtToken = await expressAuthentication((req as never) as express.Request, 'quiz', ['student']);
            expect(res.id).to.equal('user_1');
            expect(res.scope).to.equal('student');
            expect(res.stateSlice).to.equal('abcdefghi');
            expect(res.sub).to.equal('accessToken');
            expect(req).to.have.property('quiz');
            // @ts-ignore
            const quiz = req.quiz as quizToken;
            expect(quiz.id).to.equal('user_1');
            expect(quiz.sub).to.equal('quiz');
        });

        it('Should handle nonexistent accessToken token', async () => {
            const temp = constants.jwtExpiry.accessExpiry;
            constants.jwtExpiry.accessExpiry = 1;
            const tokens = await setupLoginJWTs(Container.get(RedisConnector), 'user_1', [
                'student',
                'student',
                'student'
            ]);
            const quizToken = await getJWT(
                ({ id: 'user_1' } as never) as IUserModel,
                'abcdefghi',
                constants.jwtExpiry.refreshExpiry,
                'quiz',
                'student'
            );
            await Container.get(RedisConnector).setex(
                `quiz::user_1::${quizToken.expiry}`,
                constants.jwtExpiry.idExpiry,
                quizToken.jwt
            );
            const req = {
                headers: {
                    authorization: `Bearer ${tokens.access_token}`,
                    quizrequest: `Bearer ${quizToken.jwt}`
                }
            };
            await new Promise<void>((resolve) => {
                setTimeout(() => resolve(), 1050);
            });
            try {
                await expressAuthentication((req as never) as express.Request, 'quiz', ['student']);
                expect.fail('Expected an error');
            } catch (err) {
                expect(err.error_description).to.equal(tokenNoExist);
            }
            constants.jwtExpiry.accessExpiry = temp;
        });

        it('Should handle invalid accessToken token', async () => {
            const tokens = await setupLoginJWTs(Container.get(RedisConnector), 'user_1', [
                'student',
                'student',
                'student'
            ]);
            const quizToken = await getJWT(
                ({ id: 'user_1' } as never) as IUserModel,
                'abcdefghi',
                constants.jwtExpiry.refreshExpiry,
                'quiz',
                'student'
            );
            await Container.get(RedisConnector).setex(
                `quiz::user_1::${quizToken.expiry}`,
                constants.jwtExpiry.idExpiry,
                quizToken.jwt
            );
            const req = {
                headers: {
                    authorization: `Bearer ${tokens.access_token}asdas`,
                    quizrequest: `Bearer ${quizToken.jwt}`
                }
            };
            try {
                await expressAuthentication((req as never) as express.Request, 'quiz', ['student']);
                expect.fail('Expected an error');
            } catch (err) {
                expect(err.error_description).to.equal(invalidToken);
            }
        });

        it('Should handle invalid quizToken token', async () => {
            const tokens = await setupLoginJWTs(Container.get(RedisConnector), 'user_1', [
                'student',
                'student',
                'student'
            ]);
            const quizToken = await getJWT(
                ({ id: 'user_1' } as never) as IUserModel,
                'abcdefghi',
                constants.jwtExpiry.refreshExpiry,
                'quiz',
                'student'
            );
            await Container.get(RedisConnector).setex(
                `quiz::user_1::${quizToken.expiry}`,
                constants.jwtExpiry.idExpiry,
                quizToken.jwt
            );
            const req = {
                headers: {
                    authorization: `Bearer ${tokens.access_token}`,
                    quizrequest: `Bearer ${quizToken.jwt}asdas`
                }
            };
            try {
                await expressAuthentication((req as never) as express.Request, 'quiz', ['student']);
                expect.fail('Expected an error');
            } catch (err) {
                expect(err.error_description).to.equal(invalidToken);
            }
        });
    });
});

async function setupLoginJWTs(redis: RedisConnector, userId: string, scope: scopes[] = ['admin', 'admin', 'admin']) {
    const user = ({ id: userId } as never) as IUserModel;
    const state = 'abcdefghi';
    const idToken = await getJWT(user, state, constants.jwtExpiry.idExpiry, 'idToken', scope[0]);
    const accessToken = await getJWT(user, state, constants.jwtExpiry.accessExpiry, 'accessToken', scope[1]);
    const refreshToken = await getJWT(user, state, constants.jwtExpiry.refreshExpiry, 'refreshToken', scope[2]);
    await redis.setex(`idToken::${userId}::${idToken.expiry}`, constants.jwtExpiry.idExpiry, idToken.jwt);
    await redis.setex(
        `accessToken::${userId}::${accessToken.expiry}`,
        constants.jwtExpiry.accessExpiry,
        accessToken.jwt
    );
    await redis.setex(
        `refreshToken::${userId}::${refreshToken.expiry}`,
        constants.jwtExpiry.refreshExpiry,
        refreshToken.jwt
    );
    return {
        id_token: idToken.jwt,
        access_token: accessToken.jwt,
        refresh_token: refreshToken.jwt
    };
}
