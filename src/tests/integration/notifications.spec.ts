import {expect} from 'chai';
import supertest from 'supertest';
import {server as importApp} from '../../server';
import {IntegrationHelper} from '../integration-helper';
import testingConstants from '../testing-constants';
import {equal} from "assert";
const app=supertest(importApp);
const integrationHelper=new IntegrationHelper(app);

describe(testingConstants.notifications.unsubscribeRoute,()=>{
    let name='somename';
    let sub={
        keys:{
            auth:'abcdef',
            p256dh:'asdlkasdj'
        },
        expirationTime:0,
        endpoint:'pole'
    };
    it('it unsubscribes from notifications',async()=>{
        await integrationHelper.login();
        const res=await app
            .post(testingConstants.notifications.unsubscribeRoute)
            .send({name,sub})
            .set('Authorization', integrationHelper.getBearer());
        expect(res.status).to.be.equal(200);
        expect(res.body.status).to.be.equal(true);
    })
})