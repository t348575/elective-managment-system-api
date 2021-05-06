import { UnitHelper } from '../../unit-helper';
const unitHelper = new UnitHelper();
import { Container } from 'typescript-ioc';
import { setupMockUsers } from '../../models/user.model';
import { IUserModel } from '../../../models/mongo/user-repository';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { ResponseService } from '../../../routes/response/service';
import { NotificationService } from '../../../routes/notification/service';
import { MockNotificationService } from '../mocks/mock-notification-service';
import { DownloadService } from '../../../routes/download/service';
import { MockDownloadService } from '../mocks/mock-download-service';
import { setupMockElectives } from '../../models/electives.model';
import { IElectiveModel } from '../../../models/mongo/elective-repository';
import { IFormModel } from '../../../models/mongo/form-repository';
import { createForm } from '../../models/form.model';
import * as faker from 'faker';
import { ResponseFormatter } from '../../../models/mongo/response-repository';
import { PaginationModel } from '../../../models/shared/pagination-model';

chai.use(chaiAsPromised);
let users: IUserModel[] = [];
let electives: IElectiveModel[] = [];
let form: IFormModel;
const responded: string[] = [];

before(async () => {
    await unitHelper.initMongoMemoryServer();
    Container.bind(NotificationService).to(MockNotificationService);
    Container.bind(DownloadService).to(MockDownloadService);
    users = await setupMockUsers();
    electives = await setupMockElectives(users.slice(50, 56));
    form = await createForm(electives);
});

describe('Response service', () => {
    const responseService = Container.get(ResponseService);
    it('Should respond to form', async () => {
        for (const v of users) {
            try {
                // @ts-ignore
                const selection = electives.filter((e) => e.batches.indexOf(v.batch) > -1).map((e) => e.id);
                const res = await responseService.respondToForm(
                    {
                        // @ts-ignore
                        id: form.id,
                        // @ts-ignore
                        electives: faker.helpers.shuffle(selection)
                    },
                    { id: v.id }
                );
                expect(res).to.be.instanceof(ResponseFormatter);
                expect(res.user).to.be.a('string');
                expect(res.responses).to.be.an('array');
                expect(res.responses.length).to.equal(selection.length);
                responded.push(v.id as string);
            } catch (err) {
                // eslint-disable-next-line no-empty
            }
        }
    });

    it('Should return responses', async () => {
        const res = await responseService.getPaginated(0, 500, '', '', '');
        expect(res).to.be.instanceof(PaginationModel);
        expect(res.docs).to.be.an('array');
        expect(res.docs.length).to.equal(responded.length);
        expect(res.count).to.equal(responded.length);
    });
});
