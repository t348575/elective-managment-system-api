import { UnitHelper } from '../../unit-helper';
const unitHelper = new UnitHelper();
import { Container } from 'typescript-ioc';
import { setupMockUsers } from '../models/user.model';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { IUserModel } from '../../../models/mongo/user-repository';
import { FormsService } from '../../../routes/forms/service';
import { IElectiveModel } from '../../../models/mongo/elective-repository';
import { sendResponsesToForms, setupMockElectives } from '../models/electives.model';
import * as faker from 'faker';
import { FormFormatter, FormsRepository } from '../../../models/mongo/form-repository';
import { NotificationService } from '../../../routes/notification/service';
import { MockNotificationService, mockNotifyBatches } from '../mocks/mock-notification-service';
import { BatchFormatter } from '../../../models/mongo/batch-repository';
import { PaginationModel } from '../../../models/shared/pagination-model';
import { DownloadService } from '../../../routes/download/service';
import { mockAddTemporaryUserLink, MockDownloadService } from '../mocks/mock-download-service';
import { existsSync } from 'fs';
import * as path from 'path';
import constants from '../../../constants';
import csv from 'csvtojson';

chai.use(chaiAsPromised);

let users: IUserModel[] = [];
let electives: IElectiveModel[] = [];
let formId: string;

before(async () => {
    await unitHelper.initMongoMemoryServer();
    Container.bind(NotificationService).to(MockNotificationService);
    Container.bind(DownloadService).to(MockDownloadService);
    users = await setupMockUsers();
    electives = await setupMockElectives(users.slice(50, 56));
});

describe('Forms service', () => {
    const formsService = Container.get(FormsService);

    it('Should create forms', async () => {
        const endDate = new Date();
        const startDate = new Date();
        endDate.setDate(endDate.getDate() + faker.datatype.number({ min: 1, max: 10 }));
        const res = await formsService.createForm({
            start: startDate.toISOString(),
            end: endDate.toISOString(),
            numElectives: 1,
            // @ts-ignore
            electives: electives.map((e) => e.id),
            shouldSelectAll: false
        });
        expect(res).to.be.instanceof(FormFormatter);
        expect(res.start).to.be.equal(startDate.toISOString());
        expect(res.end).to.be.equal(endDate.toISOString());
        expect(res.shouldSelect).to.be.equal(1);
        expect(res.electives).to.be.an('array');
        expect(res.electives.length).to.be.equal(5);
        expect(mockNotifyBatches.callCount).to.equal(1);
        const batches = electives.map((e) => e.batches);
        const finalBatches = [];
        for (const v of batches) {
            finalBatches.push(...v);
        }
        expect(mockNotifyBatches.args[0][0]).to.eql([...new Set(finalBatches)]);
    });

    it('Should return batches', async () => {
        const res = await formsService.getBatches();
        expect(res).to.be.an('array');
        expect(res.length).to.equal(5);
        expect(res[0]).to.be.instanceof(BatchFormatter);
    });

    it('Should get active forms', async () => {
        const electivesForBatch = electives.filter((e) => e.batches.findIndex((r) => users[0].batch === r) > -1);
        // @ts-ignore
        const res = await formsService.getActiveForms(users[0].id, 'student');
        expect(res).to.be.an('array');
        expect(res[0]).to.be.instanceof(FormFormatter);
        expect(res[0].electives.map((e) => e.id)).to.eql([...new Set(electivesForBatch.map((e) => e.id))]);
        // @ts-ignore
        formId = res[0].id;
    });

    it('Should update the form', async () => {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + faker.datatype.number({ min: 1, max: 10 }));
        await formsService.updateForm({
            id: formId,
            end: endDate.toISOString()
        });
        const res = await Container.get(FormsRepository).findOne({ _id: formId });
        expect(res).to.be.instanceof(FormFormatter);
        expect(res.end).to.equal(endDate.toISOString());
    });

    it('Should return paginated form list', async () => {
        const res = await formsService.getPaginated(0, 25, '', '', '');
        expect(res).to.be.instanceof(PaginationModel);
        expect(res.docs).to.be.an('array');
        expect(res.docs.length).to.equal(1);
        expect(res.docs[0]).to.be.instanceof(FormFormatter);
    });

    it('Should generate the form response list', async () => {
        await sendResponsesToForms(users.slice(0, 49));
        const res = await formsService.generateList(formId, true, '');
        expect(res.failed).to.be.an('array');
        expect(res.downloadUri.indexOf(`${constants.baseUrl}/downloads/temp?file=`)).to.equal(0);
        expect(mockAddTemporaryUserLink.callCount).to.equal(1);
        expect(existsSync(path.resolve(mockAddTemporaryUserLink.args[0][1]))).to.be.true;
        const data = await csv().fromFile(path.resolve(mockAddTemporaryUserLink.args[0][1]));
        expect(data).to.be.an('array');
        for (const [i, v] of data.entries()) {
            // eslint-disable-next-line no-prototype-builtins
            if (!v.hasOwnProperty('batch')) {
                break;
            }
            expect(v.rollNo).to.equal(users[i].rollNo);
        }
    });

    it('Should convert form response for elective into classes', async () => {
        const res = await formsService.createClass(formId);
        expect(res).to.haveOwnProperty('failed');
        expect(res).to.haveOwnProperty('successful');
        expect(res).to.haveOwnProperty('unresponsive');
        expect(res.failed).to.be.an('array');
        expect(res.successful).to.be.an('array');
        expect(res.unresponsive).to.be.an('array');
    });
});
