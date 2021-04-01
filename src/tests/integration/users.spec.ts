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
});
