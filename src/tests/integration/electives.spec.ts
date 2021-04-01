import {expect} from 'chai';
import supertest from 'supertest';
import {server as importApp} from '../../server';
import {IntegrationHelper} from '../integration-helper';
import testingConstants from '../testing-constants';
import {equal} from "assert";
const app=supertest(importApp);
const integrationHelper=new IntegrationHelper(app);
describe(testingConstants.oauth.name, () => {

    describe(testingConstants.electives.addRoute,  () => {
        let name='a';
        let description='test a';
        let courseCode='15csea';
        let version=1;
        let strength=1;
        let attributes=[{value: 'asd', key: 'dsa'}];
        let batches='2018-4-BTECH-CSE';
        let teachers=['cb.en.u4cse18125'];
        it('should return true status', async () => {
            await integrationHelper.login();
            const res = await app.post(testingConstants.electives.addRoute).send(
                {
                    name, description, courseCode, version, strength, attributes, batches, teachers
                }
            ).set('Authorization', integrationHelper.getBearer());
            expect(res.status).to.equal(200);
            expect(res.body.status).to.be.a('boolean');
            expect(res.body.failed).to.be.an('array');
        });
    });
/*    describe(testingConstants.electives.postElectiveRoute,()=>{
        let id='asdsa';
        let name='Bobby';
        let description='test a';
        let courseCode='15csea';
        let version=0;
        let strength=0;
        let attributes=[
            {
                value: 'asd',
                key: 'dsa'
            }];
        let batches='2018-4-BTECH-CSE';
        let teachers=['cb.en.u4cse18125']

        it('it returns ok',async()=>{
            await integrationHelper.login();
            const res=await app.post(testingConstants.electives.postElectiveRoute).send(
                {
                    id,name,description,courseCode,version,strength,attributes,batches,teachers
                }
            ).set('Authorization', integrationHelper.getBearer());
            expect(res.status).to.equal(200);
        });
    })*/

});
describe(testingConstants.electives.postElectiveRoute,()=>{
    let id='asdsa';
    let name='Bobby';
    let description='test a';
    let courseCode='15csea';
    let version=0;
    let strength=0;
    let attributes=[
        {
            value: 'asd',
            key: 'dsa'
        }];
    let batches='2018-4-BTECH-CSE';
    let teachers=['cb.en.u4cse18125']

    it('it returns all details of elective',async()=>{
        await integrationHelper.login();
        const res=await app.post(testingConstants.electives.postElectiveRoute).send(
            {
                id,name,description,courseCode,version,strength,attributes,batches,teachers
            }
        ).set('Authorization', integrationHelper.getBearer());
        expect(res.body.status).is.equal(true);
    });
})
