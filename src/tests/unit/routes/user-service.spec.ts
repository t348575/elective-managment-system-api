import 'reflect-metadata';
import { init } from '../../unit-helper';
init();
import { UserFormatter } from '../../../models/mongo/user-repository';
import { expect } from 'chai';
import userServiceModel from '../models/user-service.model';

describe('User service', () => {
    it('Should return basic user details', async () => {
        for (const v of userServiceModel.testUsers) {
            // @ts-ignore
            const res = await container.basic(v.id, v.scope);
            expect(res).to.be.instanceof(UserFormatter);
            expect(res.role).to.be.equal(v.scope);
            expect(res.id).to.be.equal(v.id);
            expect(res).not.haveOwnProperty('password');
        }
    });
});
