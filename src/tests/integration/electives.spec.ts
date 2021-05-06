import { expect } from 'chai';
import supertest from 'supertest';
import { initServer, server as importApp } from '../../server';
import { IntegrationHelper } from '../integration-helper';
let app: supertest.SuperTest<supertest.Test>;
let integrationHelper: IntegrationHelper;
before(async () => {
    app = supertest(importApp);
    integrationHelper = new IntegrationHelper(app);
    await integrationHelper.initMongoMemoryServer();
    initServer();
});
describe('/electives', () => {
    describe('/electives/add', () => {
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
                .post('/electives/add')
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
