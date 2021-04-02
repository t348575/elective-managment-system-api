import 'reflect-metadata';
import { init } from '../../unit-helper';
init();
import { UsersService } from '../../../routes/user/service';
import { UserFormatter } from '../../../models/mongo/user-repository';
import testingConstants from '../../testing-constants';
import { iocContainer } from '../../../ioc';
import { expect } from 'chai';

describe('User service', () => {
    const container = iocContainer.get<UsersService>(UsersService);
    it('Should return basic user details', async () => {
        // @ts-ignore
        const res = await container.basic(testingConstants.userId, testingConstants.scope);
        expect(res).to.be.instanceof(UserFormatter);
    });
});
