import { expect } from 'chai';
import supertest from 'supertest';
import * as qs from 'query-string';
import * as crypto from 'crypto';
import { server as importApp } from '../../server';
import { IntegrationHelper } from '../integration-helper';
import { Base64 } from 'js-base64';
import { sha256 } from 'js-sha256';
import testingConstants from '../testing-constants';

const app = supertest(importApp);
new IntegrationHelper(app);
describe(testingConstants.oauth.name, () => {
    const redirectURI = 'http://localhost:3000';
    const code_verifier = crypto.randomBytes(32).toString('hex');
    const code_challenge = Base64.fromUint8Array(testingConstants.fromHexString(sha256(code_verifier)));
    let code = '';
    let id_token = '';
    let access_token = '';
    let refresh_token = '';

    describe(testingConstants.oauth.loginRoute, () => {
        it(`should redirect to redirect uri ${redirectURI}`, async () => {
            const args = {
                response_type: 'code',
                client_id: 'api',
                redirect_uri: redirectURI,
                scope: testingConstants.scope,
                state: crypto.randomBytes(24).toString('hex'),
                username: testingConstants.username,
                password: testingConstants.password,
                code_challenge,
                code_challenge_method: 'S256'
            };
            const res = await app.get(testingConstants.oauth.loginRoute).query(args);
            expect(res.status).to.equal(302);
            const resParam = qs.parseUrl(res.header.location);
            expect(resParam.query.code).to.be.a('string');
            // @ts-ignore
            code = resParam.query.code;
        });
    });

    describe(testingConstants.oauth.tokenRoute, () => {
        it('should return access_token, id_token, refresh_token', async () => {
            const res = await app.post(testingConstants.oauth.tokenRoute).send({ code_verifier, code });
            expect(res.status).to.equal(200);
            expect(res.body.refresh_token).to.be.a('string');
            expect(res.body.access_token).to.be.a('string');
            expect(res.body.id_token).to.be.a('string');
            id_token = res.body.id_token;
            access_token = res.body.access_token;
            refresh_token = res.body.refresh_token;
        });
    });

    describe(testingConstants.oauth.refreshRoute, () => {
        it('should return access_token, refresh_token', async () => {
            const res = await app
                .post(testingConstants.oauth.refreshRoute)
                .set('Authorization', `Bearer ${access_token}`)
                .send({ refresh_token });
            expect(res.status).to.equal(200);
            expect(res.body.refresh_token).to.be.a('string');
            expect(res.body.access_token).to.be.a('string');
            refresh_token = res.body.refresh_token;
            access_token = res.body.access_token;
        });
    });

    describe(testingConstants.oauth.logoutRoute, () => {
        it('expect status 302', async () => {
            const res = await app
                .get(testingConstants.oauth.logoutRoute)
                .query({ refresh_token, id_token })
                .set('Authorization', `Bearer ${access_token}`);
            expect(res.status).to.equal(302);
        });
    });
});
