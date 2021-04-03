import 'reflect-metadata';
import { init } from '../../unit-helper';
init();
import { expect } from 'chai';
import userServiceModel from '../models/user-service.model';
import { Container } from 'typescript-ioc';
import { UsersService } from '../../../routes/user/service';
import { PrivateInjectorInit } from '../../../routes/private-injector-init';

before(() => {
    Container.get(PrivateInjectorInit);
});

describe('User service', () => {
    const container = Container.get(UsersService);
    it('Should return basic user details', async () => {
        for (const v of userServiceModel.testUsers) {
            // @ts-ignore
            const res = await container.basic(v.id, v.scope);
            expect(res.role).to.be.equal(v.scope);
            expect(res.id).to.be.equal(v.id);
            expect(res).to.not.have.property('password');
        }
    });
});
