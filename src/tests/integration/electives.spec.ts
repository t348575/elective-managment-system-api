import { expect } from 'chai';
import supertest from 'supertest';
import { server as importApp } from '../../server';
import { IntegrationHelper } from '../integration-helper';
import testingConstants from '../testing-constants';
const app = supertest(importApp);
const integrationHelper = new IntegrationHelper(app);
describe(testingConstants.oauth.name, () => {
    describe(testingConstants.electives.addRoute, () => {
        const name = 'a';
        const description = 'test a';
        const courseCode = '15csea';
        const version = 1;
        const strength = 1;
        const attributes = [{ value: 'asd', key: 'dsa' }];
        const batches = '2018-4-BTECH-CSE';
        const teachers = ['cb.en.u4cse18125'];
        it('should return true status', async () => {
            await integrationHelper.login();
            const res = await app
                .post(testingConstants.electives.addRoute)
                .send({
                    name,
                    description,
                    courseCode,
                    version,
                    strength,
                    attributes,
                    batches,
                    teachers
                })
                .set('Authorization', integrationHelper.getBearer());
            expect(res.status).to.equal(200);
            expect(res.body.status).to.be.equal(true);
            expect(res.body.failed).to.be.an('array');
        });
    });
});
