/*
import { UnitHelper } from '../../unit-helper';
const unitHelper = new UnitHelper();
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { IUserModel } from "../../../models/mongo/user-repository";
import { Container } from "typescript-ioc";
import { PrivateInjectorInit } from "../../../routes/private-injector-init";
import { MailService } from "../../../shared/mail-service";
import { mockMailReplaceSpy, MockMailService } from "../other/mock-mail-service";
import { setupMockUsers } from "../models/user.model";
import { ElectivesService } from "../../../routes/electives/service";

chai.use(chaiAsPromised);
let users: IUserModel[] = [];
before(async () => {
    await unitHelper.init();
    Container.get(PrivateInjectorInit);
    Container.bind(MailService).to(MockMailService);
    users = await setupMockUsers();
});

before('Electives service', () => {

    afterEach(() => {
        mockMailReplaceSpy.resetHistory();
    });
    const electiveService = Container.get(ElectivesService);

    it()
});
*/
