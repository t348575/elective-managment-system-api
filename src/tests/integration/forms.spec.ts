import { expect } from 'chai';
import supertest from 'supertest';
import { server as importApp } from '../../server';
import { IntegrationHelper } from '../integration-helper';
import testingConstants from '../testing-constants';
const app = supertest(importApp);
const integrationHelper = new IntegrationHelper(app);

describe(testingConstants.forms.batchesRoute, () => {
    it('returns details of batch', async () => {
        await integrationHelper.login();
        const res = await app
            .get(testingConstants.forms.batchesRoute)
            .set('Authorization', integrationHelper.getBearer());
        expect(res.status).to.equal(200);
        expect(res.body[0].id).to.be.a('string');
        expect(res.body[0].degree).to.be.a('string');
        expect(res.body[0].course).to.be.a('string');
    });
});
describe(testingConstants.forms.activeRoutes, () => {
    it('returns all the active forms', async () => {
        await integrationHelper.login();
        const res = await app
            .get(testingConstants.forms.activeRoutes)
            .set('Authorization', integrationHelper.getBearer());
        expect(res.status).to.equal(200);
    });
});
describe(testingConstants.forms.getForms, () => {
    it('gets details of form', async () => {
        await integrationHelper.login();
        const args = {
            pageNumber: 12,
            limit: 20
        };
        const res = await app
            .get(testingConstants.forms.getForms)
            .query(args)
            .set('Authorization', integrationHelper.getBearer());
        expect(res.status).to.equal(200);
        expect(res.body.count).to.be.a('number');
    });
});
/*
describe(testingConstants.forms.postForms,()=>{
    let id='iua98das';
    let start='asudhasdj2910';
    let end='9281hjkasd';
    let num=0;
    let electives=['123abc','456def'];
    it('post request for forms',async()=>{
        await integrationHelper.login();
        const res=await app.post(testingConstants.forms.postForms)
            .send({id,start,end,num,electives})
            .set('Authorization',integrationHelper.getBearer());
        expect(res.status).to.be.equal(200);
    })
})
describe(testingConstants.forms.deleteForms,()=>{
    const args={
        id:'123abc'
    };
    it('deletes form with code 204',async()=>{
        await integrationHelper.login();
        const res=await app.delete(testingConstants.forms.deleteForms)
            .query(args)
            .set('Authorization',integrationHelper.getBearer());
        expect(res.status).to.be.equal(204);
    })
})*/
/*describe(testingConstants.forms.generateElectiveList,()=>{
    it('returns download uri',async()=>{
        await integrationHelper.login();
        const args={
             id:'123abcdef',
             closeForm:true
        }
        const res=await app.get(testingConstants.forms.generateElectiveList)
            .query(args)
            .set('Authorization',integrationHelper.getBearer());
        expect(res.status).to.be.equal(200);
    })
})*/
/*describe(testingConstants.forms.createClasses,()=>{
    it('returns for create classes',async()=>{
        await integrationHelper.login();
        const args={
            formId:'123def'
        };
        const res=await app.post(testingConstants.forms.createClasses)
            .query(args);
            .set('Authorization',integrationHelper.getBearer());
        expect(res.status).to.be.equal(200);
    })
})*/
