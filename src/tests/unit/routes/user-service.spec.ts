import { UnitHelper } from '../../unit-helper';
const unitHelper = new UnitHelper();
import { Container } from 'typescript-ioc';
import * as argon2 from 'argon2';
import { getMockUsers, setupMockUsers } from '../../models/user.model';
import { IUserModel, UserFormatter } from '../../../models/mongo/user-repository';
import { UsersService } from '../../../routes/user/service';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { MockMailService, mockMailReplaceSpy } from '../../mocks/mock-mail-service';
import { MailService } from '../../../shared/mail-service';
import * as qs from 'query-string';

chai.use(chaiAsPromised);

let users: IUserModel[] = [];
let code: string;

before(async () => {
    await unitHelper.initMongoMemoryServer();
    Container.bind(MailService).to(MockMailService);
    users = await setupMockUsers();
});

describe('User service', () => {
    afterEach(() => {
        mockMailReplaceSpy.resetHistory();
    });

    const userService = Container.get(UsersService);

    it('Should return basic user details', async () => {
        for (const v of users) {
            // @ts-ignore
            const res = await userService.basic(v.id, v.role);
            expect(res).to.be.instanceof(UserFormatter);
            expect(res).to.not.have.property('password');
            expect(res).to.not.have.property('_id');
            expect(res.role).to.be.equal(v.role);
            expect(res.rollNo).to.be.equal(v.rollNo);
        }
    });

    it('Should create users', async () => {
        const res = await userService.createUsers(getMockUsers(), { defaultRollNoAsEmail: false });
        expect(res).to.be.an('array');
        expect(res.length).to.be.equal(0);
        expect(mockMailReplaceSpy.callCount).is.equal(1);
    });

    it('Update password works', async () => {
        // @ts-ignore
        await userService.updatePass(users[0].id, 'new_pass');
        // @ts-ignore
        const res = await userService.getById(users[0].id);
        expect(await argon2.verify(res.password, 'new_pass')).to.be.true;
    });

    it('Should request a new password', async () => {
        // @ts-ignore
        expect(userService.requestReset(users[0].id)).to.eventually.be.rejected;
        const res = await userService.requestReset(users[0].username);
        expect(res).to.have.property('status');
        expect(res.status).to.be.true;
        expect(qs.parseUrl(mockMailReplaceSpy.args[0][1][0].url).query.code).to.be.a('string');
        // @ts-ignore
        expect(qs.parseUrl(mockMailReplaceSpy.args[0][1][0].url).query.code.length).to.be.equal(64);
        // @ts-ignore
        code = qs.parseUrl(mockMailReplaceSpy.args[0][1][0].url).query.code;
    });

    it('Password reset code should exist', async () => {
        const res = await userService.validReset(code);
        expect(res).to.not.be.undefined;
        expect(res).to.not.be.null;
    });

    it('Should reset password with code', async () => {
        const res = await userService.resetPassword({
            password: 'admin',
            code
        });
        expect(res).to.have.property('status');
        expect(res.status).to.be.true;
        // @ts-ignore
        const user = await userService.getById(users[0].id);
        expect(await argon2.verify(user.password, 'admin')).to.be.true;
    });

    it('Should update user', async () => {
        const res = await userService.updateUser([
            {
                rollNo: users[0].rollNo,
                name: 'asd'
            }
        ]);
        expect(res).to.be.an('array');
        expect(res.length).to.be.equal(0);
        // @ts-ignore
        const user = await userService.getById(users[0].id);
        expect(user.name).to.be.equal('asd');
        const rollNoNoExist = await userService.updateUser([
            {
                rollNo: 'no_exist',
                name: 'asd'
            }
        ]);
        expect(rollNoNoExist).to.be.an('array');
        expect(rollNoNoExist.length).to.be.equal(1);
    });

    it('Should get user by rollNo', async () => {
        const res = await userService.getByRollNo(users[0].rollNo);
        expect(res).to.be.instanceof(UserFormatter);
        expect(res).to.not.have.property('password');
        expect(userService.getByRollNo('no_exist')).to.eventually.be.rejected;
    });

    it('Should delete users', async () => {
        // @ts-ignore
        const res = await userService.deleteUsers([users[0].id]);
        expect(res).to.be.an('array');
        expect(res.length).to.be.equal(0);
    });
});
