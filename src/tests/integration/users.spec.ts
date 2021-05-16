import { expect } from 'chai';
import supertest from 'supertest';
import { closeServer, initServer, server as importApp } from '../../server';
import { IntegrationHelper } from '../integration-helper';

let app: supertest.SuperTest<supertest.Test>;
let integrationHelper: IntegrationHelper;

describe('/users', () => {
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
    describe('/users/basic', () => {
        it('returns appropriate user information', async () => {
            const res = await app.get('/users/basic').set('Authorization', integrationHelper.getBearer());
            expect(res.status).to.equal(200);
            expect(res.body.username).to.equal(integrationHelper.users[integrationHelper.users.length - 1].username);
            expect(res.body).not.haveOwnProperty('password');
        });
    });

    describe('/users/scope', () => {
        it(`returns correct scope: 'admin'`, async () => {
            const res = await app.get('/users/scope').set('Authorization', integrationHelper.getBearer());
            expect(res.status).to.equal(200);
            expect(res.body).to.equal('admin');
        });
    });
    describe('/users/create', () => {
        const batch = 'asdasd';
        const role = 'admin';
        const rollNo = 'nlkjok';
        const username = 'asdaadasd';
        const name = 'blah';
        const defaultRollNoAsEmail = true;
        const users = [{ batch, role, rollNo, username, name }];
        it('creates user', async () => {
            const res = await app
                .post('/users/create')
                .send({ users, defaultRollNoAsEmail })
                .set('Authorization', integrationHelper.getBearer());
            expect(res.status).to.equal(200);
        });
    });
    describe('/users/user-by-roll-no', () => {
        it('returns user by roll no', async () => {
            const args = {
                rollNo: integrationHelper.users[integrationHelper.users.length - 1].rollNo
            };
            const res = await app
                .get('/users/user-by-roll-no')
                .query(args)
                .set('Authorization', integrationHelper.getBearer());
            expect(res.status).to.equal(200);
            expect(res.body.name).to.be.a('string');
            expect(res.body.username).to.be.a('string');
            expect(res.body.role).to.be.equal('admin');
            expect(res.body.rollNo).to.be.a('string');
        });
    });
    describe('/users/validReset', () => {
        it('returns a string message for valid reset', async () => {
            const args = {
                code: 'code'
            };
            const res = await app
                .get('/users/validReset')
                .query(args)
                .set('Authorization', integrationHelper.getBearer());
            expect(res.status).to.equal(200);
            expect(res.body.message).to.be.a('string');
            expect(res.body.status).to.be.a('boolean');
        });
    });
});
