import { UnitHelper } from '../../unit-helper';
const unitHelper = new UnitHelper();
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { IUserModel } from '../../../models/mongo/user-repository';
import { IElectiveModel } from '../../../models/mongo/elective-repository';
import { IFormModel } from '../../../models/mongo/form-repository';
import { Container } from 'typescript-ioc';
import { NotificationService } from '../../../routes/notification/service';
import { MockNotificationService } from '../../mocks/mock-notification-service';
import { setupMockUsers } from '../../models/user.model';
import { setupMockElectives } from '../../models/electives.model';
import { createForm } from '../../models/form.model';
import { respondToForm } from '../../models/response.model';
import { createClasses } from '../../models/classes.model';
import { IClassModel } from '../../../models/mongo/class-repository';
import * as express from 'express';
import proxyquire from 'proxyquire';
import {
    mockCreateReadStream,
    mockCreateWriteStream,
    MockFsFilestream
} from '../../mocks/mock-fs-filestream';

const proxyFsStreams = proxyquire('../../../routes/download/service', {
    'fs': MockFsFilestream
});

import { DownloadService as RealDownloadService } from '../../../routes/download/service';
import { DownloadFormatter, DownloadRepository } from '../../../models/mongo/download-repository';

chai.use(chaiAsPromised);
let users: IUserModel[] = [];
let electives: IElectiveModel[] = [];
let form: IFormModel;
let classes: IClassModel[] = [];
let fileResource: string;

describe('Downloads service' , () => {
    before(async () => {
        await unitHelper.init();
        Container.bind(NotificationService).to(MockNotificationService);
        users = await setupMockUsers();
        electives = await setupMockElectives(users.slice(50, 56));
        form = await createForm(electives);
        await respondToForm(form, users, electives);
        classes = (await createClasses(form)).docs as IClassModel[];
    });

    afterEach(() => {
        mockCreateWriteStream.resetHistory();
        mockCreateReadStream.resetHistory();
        MockFsFilestream.cleanup();
    });
    const downloadService = Container.get(proxyFsStreams.DownloadService) as RealDownloadService;

    it('Should create temporary download link', async () => {
        const res = await downloadService.addTemporaryUserLink([users[56]].map(e => e.id as string), '/to/some/path/some_file.txt', 'some_file.txt');
        expect(res).to.be.a('string');
        expect(res.length).to.equal(128);
        const repoEntry = await Container.get(DownloadRepository).findOne({ fileId: res });
        expect(repoEntry).to.be.instanceof(DownloadFormatter);
        expect(repoEntry.name).to.equal('some_file.txt');
        expect(repoEntry.path).to.equal('/to/some/path/some_file.txt');
        expect(repoEntry.limitedTo).to.deep.equal([users[56]].map(e => e.id as string));
    });

    it('Should add class resource', async () => {
        const res = await downloadService.addClassResource({
            classId: classes[0].id as string,
            shouldTrack: false
        }, {
            file: {
                buffer: Buffer.from('some_random_data'),
                originalname: 'some_file.txt'
            }
        } as express.Request);
        expect(res).to.be.a('string');
        expect(res.length).to.equal(128);
        expect(mockCreateWriteStream.callCount).to.equal(1);
    });

    it('Should get class file', async () => {
        const fileId = await downloadService.addTemporaryUserLink([users[56]].map(e => e.id as string), '/to/some/path/some_file.txt', 'some_file.txt');
        MockFsFilestream.createWriteStream('/to/some/path/some_file.txt', { flags: ''}).write(Buffer.from('some_random_data'));
        const resObj = {};
        await downloadService.getTemporaryFile(fileId, users[56].id as string, resObj as express.Response);
        expect(resObj).to.have.property('body');
        // @ts-ignore
        expect(resObj.body.toString()).to.equal('some_random_data');
    });

    it('Should get temporary file', async () => {
        const fileId = await downloadService.addClassResource({
            classId: classes[0].id as string,
            shouldTrack: false
        }, {
            file: {
                buffer: Buffer.from('some_random_data'),
                originalname: 'some_file.txt'
            }
        } as express.Request);
        const resObj = {};
        await downloadService.getClassResource(fileId, classes[0].students[0] as never as string, resObj as express.Response);
        expect(resObj).to.have.property('body');
        // @ts-ignore
        expect(resObj.body.toString()).to.equal('some_random_data');
        fileResource = fileId;
    });

    it('Should delete class resource', async () => {
        await downloadService.deleteClassResource(fileResource, classes[0].teacher.id as string, 'teacher');
        try {
            await Container.get(DownloadRepository).findOne({ fileId: fileResource });
            expect.fail('Expected an error!');
        }
        catch(err) {
            expect(err.name).to.equal('Not Found');
        }
    });

    it('Should get class tracked resource', async () => {
        const fileId = await downloadService.addClassResource({
            classId: classes[0].id as string,
            shouldTrack: true
        }, {
            file: {
                buffer: Buffer.from('some_random_data'),
                originalname: 'some_file.txt'
            }
        } as express.Request);
        const res = await downloadService.getTrackedClassResource(fileId, classes[0].teacher.id as string, 'teacher');
        expect(res).to.be.instanceof(DownloadFormatter);
        expect(res.fileId).to.equal(fileId);
        expect(res.shouldTrack).to.be.true;
    });

});
