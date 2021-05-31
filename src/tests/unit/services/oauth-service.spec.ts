import { UnitHelper } from '../../unit-helper';
const unitHelper = new UnitHelper();

import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { IUserModel } from '../../../models/mongo/user-repository';
import { setupMockUsers } from '../../models/user.model';
import { Container } from 'typescript-ioc';
import { NotificationService } from '../../../routes/notification/service';
import { MockNotificationService } from '../../mocks/mock-notification-service';
import { OAuthService, serverError } from '../../../routes/oauth/service';
import crypto from 'crypto';
import { Base64 } from 'js-base64';
import { sha256 } from 'js-sha256';
import { fromHexString } from '../../integration-helper';
import { spy } from 'sinon';
import { Response as ExResponse } from 'express';
import * as qs from 'query-string';
import { OAuthError } from '../../../shared/error-handler';

chai.use(chaiAsPromised);
let users: IUserModel[] = [];

const responseMock = {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-empty-function
    status: (code: number): void => {},
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-empty-function
    json: (body: never): void => {},
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-empty-function
    redirect: (url: string): void => {}
};

const spyResponse = spy(responseMock);

describe('OAuth service', () => {
    before(async () => {
        await unitHelper.init();
        Container.bind(NotificationService).to(MockNotificationService);
        users = await setupMockUsers();
    });

    afterEach(() => {
        spyResponse.status.resetHistory();
        spyResponse.json.resetHistory();
        spyResponse.redirect.resetHistory();
    });

    const oauthService = Container.get(OAuthService);

    it('Should test server error', async () => {
        try {
            await new Promise((resolve, reject) => {
                serverError({ name: 'test_err', message: 'some_message' }, reject);
            });
            expect.fail('Expected an error');
        }
        catch(err) {
            expect(err).to.be.instanceof(OAuthError);
            expect(err.name).to.equal('server_error');
            expect(err.error_description).to.equal('some_message');
        }
    });

    describe('Authorize', () => {

        it('It should authorize site', async () => {
            const code_verifier = crypto.randomBytes(32).toString('hex');
            const code_challenge = Base64.fromUint8Array(fromHexString(sha256(code_verifier)));
            await oauthService.authorize(
                users[0].username,
                'admin',
                code_challenge,
                crypto.randomBytes(24).toString('hex'),
                'https://localhost:3000',
                'site',
                'student',
                spyResponse as never as ExResponse
            );
            expect(spyResponse.status.callCount).to.equal(1);
            expect(spyResponse.json.callCount).to.equal(1);
            expect(spyResponse.status.calledWith(200));
            expect(spyResponse.json.args[0][0]).to.have.property('code');
            // @ts-ignore
            expect(spyResponse.json.args[0][0].code).to.be.a('string');
        });

        it('It should authorize api', async () => {
            const code_verifier = crypto.randomBytes(32).toString('hex');
            const code_challenge = Base64.fromUint8Array(fromHexString(sha256(code_verifier)));
            await oauthService.authorize(
                users[0].username,
                'admin',
                code_challenge,
                crypto.randomBytes(24).toString('hex'),
                'https://localhost:3000',
                'api',
                'student',
                spyResponse as never as ExResponse
            );
            expect(spyResponse.redirect.callCount).to.equal(1);
            expect(spyResponse.redirect.args[0][0]).to.be.a('string');
            const uri = qs.parseUrl(spyResponse.redirect.args[0][0]);
            expect(uri.query).to.have.property('code');
            expect(uri.url.indexOf('https://localhost:3000')).to.equal(0);
        });

        it('Should fail for unknown user', async () => {
            try {
                const code_verifier = crypto.randomBytes(32).toString('hex');
                const code_challenge = Base64.fromUint8Array(fromHexString(sha256(code_verifier)));
                await oauthService.authorize(
                    'asd',
                    'admin',
                    code_challenge,
                    crypto.randomBytes(24).toString('hex'),
                    'https://localhost:3000',
                    'api',
                    'student',
                    spyResponse as never as ExResponse
                );
                expect.fail('Expected an error');
            }
            catch(err) {
                expect(err).to.be.instanceof(OAuthError);
                expect(err.name).to.equal('access_denied');
            }
        });

        it('Should fail for invalid scope', async () => {
            try {
                const code_verifier = crypto.randomBytes(32).toString('hex');
                const code_challenge = Base64.fromUint8Array(fromHexString(sha256(code_verifier)));
                await oauthService.authorize(
                    users[0].username,
                    'admin',
                    code_challenge,
                    crypto.randomBytes(24).toString('hex'),
                    'https://localhost:3000',
                    'api',
                    'admin',
                    spyResponse as never as ExResponse
                );
                expect.fail('Expected an error');
            }
            catch(err) {
                expect(err).to.be.instanceof(OAuthError);
                expect(err.name).to.equal('invalid_scope');
            }
        });

        it('It should fail for invalid password', async () => {
            try {
                const code_verifier = crypto.randomBytes(32).toString('hex');
                const code_challenge = Base64.fromUint8Array(fromHexString(sha256(code_verifier)));
                await oauthService.authorize(
                    users[0].username,
                    'ad',
                    code_challenge,
                    crypto.randomBytes(24).toString('hex'),
                    'https://localhost:3000',
                    'site',
                    'student',
                    spyResponse as never as ExResponse
                );
                expect.fail('Expected an error');
            }
            catch(err) {
                expect(err).to.be.instanceof(OAuthError);
                expect(err.name).to.equal('access_denied');
            }
        });

    });
});
