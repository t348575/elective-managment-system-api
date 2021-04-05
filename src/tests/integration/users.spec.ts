import { expect } from 'chai';
import supertest from 'supertest';
import { server as importApp } from '../../server';
import { IntegrationHelper } from '../integration-helper';
import testingConstants from '../testing-constants';

const app = supertest(importApp);
const integrationHelper = new IntegrationHelper(app);

describe(testingConstants.users.name, () => {
    describe(testingConstants.users.basicRoute, () => {
        it('returns appropriate user information', async () => {
            await integrationHelper.login();
            const res = await app
                .get(testingConstants.users.basicRoute)
                .set('Authorization', integrationHelper.getBearer());
            expect(res.status).to.equal(200);
            expect(res.body.username).to.equal(testingConstants.username);
            expect(res.body).not.haveOwnProperty('password');
        });
    });

    describe(testingConstants.users.scopeRoute, () => {
        it(`returns correct scope: ${testingConstants.scope}`, async () => {
            const res = await app
                .get(testingConstants.users.scopeRoute)
                .set('Authorization', integrationHelper.getBearer());
            expect(res.status).to.equal(200);
            expect(res.body).to.equal(testingConstants.scope);
        });
    });
    describe(testingConstants.users.createRoute, () => {
        const batch = 'asdasd';
        const role = 'admin';
        const rollNo = 'nlkjok';
        const username = 'asdaadasd';
        const name = 'blah';
        const defaultRollNoAsEmail = true;
        const users = [{ batch, role, rollNo, username, name }];
        it('creates user', async () => {
            const res = await app
                .post(testingConstants.users.createRoute)
                .send({ users, defaultRollNoAsEmail })
                .set('Authorization', integrationHelper.getBearer());
            expect(res.status).to.equal(200);
        });
    });
    describe(testingConstants.users.userByRollNoRoute, () => {
        it('returns user by roll no', async () => {
            const args = {
                rollNo: 'cb.en.u4cse18105'
            };
            const res = await app
                .get(testingConstants.users.userByRollNoRoute)
                .query(args)
                .set('Authorization', integrationHelper.getBearer());
            expect(res.status).to.equal(200);
            expect(res.body.name).to.be.a('string');
            expect(res.body.username).to.be.a('string');
            expect(res.body.role).to.be.equal('student');
            expect(res.body.rollNo).to.be.a('string');
            expect(res.body.batch.id).to.be.a('string');
            expect(res.body.batch.year).to.be.equal(2018);
        });
    });
    describe(testingConstants.users.validResetRoute, () => {
        it('returns a string message for valid reset', async () => {
            const args = {
                code: 'code'
            };
            const res = await app
                .get(testingConstants.users.validResetRoute)
                .query(args)
                .set('Authorization', integrationHelper.getBearer());
            expect(res.status).to.equal(200);
            expect(res.body.message).to.be.a('string');
            expect(res.body.status).to.be.a('boolean'); //here
        });
    });
});
