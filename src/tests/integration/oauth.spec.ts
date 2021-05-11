import { expect } from 'chai';
import supertest from 'supertest';
import * as qs from 'query-string';
import * as crypto from 'crypto';
import { closeServer, initServer, server as importApp } from '../../server';
import { fromHexString, IntegrationHelper } from '../integration-helper';
import { Base64 } from 'js-base64';
import { sha256 } from 'js-sha256';
let app: supertest.SuperTest<supertest.Test>;
let integrationHelper: IntegrationHelper;
describe('/oauth', () => {
    before(async () => {
        app = supertest(importApp);
        integrationHelper = new IntegrationHelper(app);
        await integrationHelper.init();
        initServer();
        await integrationHelper.login();
    });
    after(() => {
        closeServer();
    });
    const redirectURI = 'http://localhost:3000';
    const code_verifier = crypto.randomBytes(32).toString('hex');
    const code_challenge = Base64.fromUint8Array(fromHexString(sha256(code_verifier)));
    let code = '';
    let id_token = '';
    let access_token = '';
    let refresh_token = '';

    describe('/oauth/authorize', () => {
        it(`should redirect to redirect uri ${redirectURI}`, async () => {
            const args = {
                response_type: 'code',
                client_id: 'api',
                redirect_uri: redirectURI,
                scope: 'admin',
                state: crypto.randomBytes(24).toString('hex'),
                username: integrationHelper.users[integrationHelper.users.length - 1].username,
                password: 'admin',
                code_challenge,
                code_challenge_method: 'S256'
            };
            const res = await app.get('/oauth/authorize').query(args);
            expect(res.status).to.equal(302);
            const resParam = qs.parseUrl(res.header.location);
            expect(resParam.query.code).to.be.a('string');
            // @ts-ignore
            code = resParam.query.code;
        });
    });

    describe('/oauth/token', () => {
        it('should return access_token, id_token, refresh_token', async () => {
            const res = await app.post('/oauth/token').send({ code_verifier, code });
            expect(res.status).to.equal(200);
            expect(res.body.refresh_token).to.be.a('string');
            expect(res.body.access_token).to.be.a('string');
            expect(res.body.id_token).to.be.a('string');
            id_token = res.body.id_token;
            access_token = res.body.access_token;
            refresh_token = res.body.refresh_token;
        });
    });

    describe('/oauth/refresh', () => {
        it('should return access_token, refresh_token', async () => {
            const res = await app
                .post('/oauth/refresh')
                .set('Authorization', `Bearer ${access_token}`)
                .send({ refresh_token });
            expect(res.status).to.equal(200);
            expect(res.body.refresh_token).to.be.a('string');
            expect(res.body.access_token).to.be.a('string');
            refresh_token = res.body.refresh_token;
            access_token = res.body.access_token;
        });
    });

    describe('/oauth/logout', () => {
        it('expect status 302', async () => {
            const res = await app
                .get('/oauth/logout')
                .query({ refresh_token, id_token })
                .set('Authorization', `Bearer ${access_token}`);
            expect(res.status).to.equal(204);
        });
    });
});
