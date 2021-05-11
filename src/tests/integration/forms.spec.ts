import { expect } from 'chai';
import supertest from 'supertest';
import { closeServer, initServer, server as importApp } from '../../server';
import { IntegrationHelper } from '../integration-helper';
let app: supertest.SuperTest<supertest.Test>;
let integrationHelper: IntegrationHelper;

describe('/forms/batches', () => {
    before(async () => {
        app = supertest(importApp);
        integrationHelper = new IntegrationHelper(app);
        await integrationHelper.init();
        initServer();
    });

    after(() => {
        closeServer();
    });
    it('returns details of batch', async () => {
        await integrationHelper.login();
        const res = await app
            .get('/forms/batches')
            .set('Authorization', integrationHelper.getBearer());
        expect(res.status).to.equal(200);
        expect(res.body[0].id).to.be.a('string');
        expect(res.body[0].degree).to.be.a('string');
        expect(res.body[0].course).to.be.a('string');
    });
});
describe('/forms/active-forms', () => {
    it('returns all the active forms', async () => {
        await integrationHelper.login();
        const res = await app
            .get('/forms/active-forms')
            .set('Authorization', integrationHelper.getBearer());
        expect(res.status).to.equal(200);
    });
});
describe('/forms', () => {
    it('gets details of form', async () => {
        await integrationHelper.login();
        const args = {
            pageNumber: 12,
            limit: 20
        };
        const res = await app
            .get('/forms')
            .query(args)
            .set('Authorization', integrationHelper.getBearer());
        expect(res.status).to.equal(200);
        expect(res.body.count).to.be.a('number');
    });
});
