import { UnitHelper } from '../../unit-helper';
const unitHelper = new UnitHelper();
import { Container } from 'typescript-ioc';
import { setupMockUsers } from '../../models/user.model';
import { IUserModel, UserFormatter } from '../../../models/mongo/user-repository';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { NotificationService } from '../../../routes/notification/service';
import { MockNotificationService } from '../../mocks/mock-notification-service';
import { DownloadService } from '../../../routes/download/service';
import { MockDownloadService } from '../../mocks/mock-download-service';
import { setupMockElectives } from '../../models/electives.model';
import { IElectiveModel } from '../../../models/mongo/elective-repository';
import { FormFormatter, FormsRepository, IFormModel } from '../../../models/mongo/form-repository';
import { createForm } from '../../models/form.model';
import { ClassService } from '../../../routes/classes/service';
import { FormsService } from '../../../routes/forms/service';
import { PaginationModel } from '../../../models/shared/pagination-model';
import { respondToForm } from '../../models/response.model';
import { ClassFormatter, IClassModel } from '../../../models/mongo/class-repository';
import { createClasses } from '../../models/classes.model';
import { RequestChangeFormatter, RequestChangeRepository } from '../../../models/mongo/request-change-repository';

chai.use(chaiAsPromised);
let users: IUserModel[] = [];
let electives: IElectiveModel[] = [];
let form: IFormModel;
let responses: string[] = [];
let useClass: string;
let classCount = 0;
let classes: IClassModel[] = [];

describe('Classes service', () => {
    const classService = Container.get(ClassService);

    before(async () => {
        await unitHelper.init();
        Container.bind(NotificationService).to(MockNotificationService);
        Container.bind(DownloadService).to(MockDownloadService);
        users = await setupMockUsers();
        electives = await setupMockElectives(users.slice(50, 56));
        form = await createForm(electives);
        responses = await respondToForm(form, users, electives);
    });

    it('Should create classes', async () => {
        const formId = form.id as string;
        const currForm: IFormModel = (
            await Container.get(FormsRepository).findAndPopulate('', { _id: formId }, false, 0)
        )[0];
        const electiveCountMap = new Map<string, { count: number; users: IUserModel[] }>();
        const { selections } = await Container.get(FormsService).rawList(formId);
        await Container.get(FormsRepository).update(formId, {
            end: currForm.end,
            start: currForm.start,
            // @ts-ignore
            electives: currForm.electives.map((e) => e.id),
            active: false
        });
        for (const v of currForm.electives) {
            electiveCountMap.set(v.courseCode + v.version, { count: 0, users: [] });
        }
        for (const v of selections) {
            if (v.electives.length > 0) {
                for (const k of v.electives) {
                    const item = electiveCountMap.get(k.courseCode + k.version);
                    if (item) {
                        item.count++;
                        item.users.push(v.user);
                    }
                }
            }
        }
        await classService.createClass(electiveCountMap, currForm);
    });

    it('Should get active classes', async () => {
        const res = await classService.getPaginated(0, 500, '', '', '');
        expect(res).to.be.instanceof(PaginationModel);
        expect(res.docs).to.be.an('array');
        expect(res.count).to.be.a('number');
        expect(res.count).to.be.greaterThan(0);
        classCount = res.count;
    });

    it('Should get active classes', async () => {
        const res = await classService.getActiveClasses(responses[0]);
        expect(res).to.be.an('array');
        expect(res.length).to.be.greaterThan(0);
        expect(res[0]).to.be.instanceof(ClassFormatter);
        // @ts-ignore
        expect(res[0].students.indexOf(responses[0]) > -1);
        useClass = res[0].id as string;
    });

    it('Should return class students', async () => {
        const res = await classService.getStudents(useClass);
        expect(res).to.be.an('array');
        expect(res.length).to.be.greaterThan(0);
        expect(res[0]).to.be.instanceof(UserFormatter);
    });

    it('Should delete class', async () => {
        await classService.deleteClass(useClass);
        expect((await classService.getPaginated(0, 500, '', '', '')).count).to.equal(classCount - 1);
    });

    it('Can request elective change', async () => {
        form = await createForm(electives);
        await respondToForm(form, users, electives);
        classes = (await createClasses(form)).docs as IClassModel[];
        await Container.get(FormsService).removeForm(form.id as string);
        const res = await classService.canRequestElectiveChange(users[0].id as string);
        expect(res).to.be.an('array');
        expect(res.length).to.be.greaterThan(0);
        expect(res[0]).to.be.instanceof(FormFormatter);
    });

    it('Should get valid request electives', async () => {
        const res = await classService.getValidRequestElectives(users[0].id as string);
        expect(res).to.be.an('array');
        expect(res.length).to.be.greaterThan(0);
    });

    it('Should add elective change request', async () => {
        const items = await classService.getValidRequestElectives(users[0].id as string);
        const activeClasses = await classService.getActiveClasses(users[0].id as string);
        const res = await classService.addElectiveChange({
            from: activeClasses[0].elective.id as string,
            to: items[0].id as string
        }, users[0].id as string);
        expect(res).to.be.instanceof(RequestChangeFormatter);
    });

    it('Should get elective change requests', async () => {
        const res = await classService.getElectiveChanges();
        expect(res).to.be.an('array');
        expect(res.length).to.be.greaterThan(0);
        expect(res[0]).to.be.instanceof(RequestChangeFormatter);
    });

    it('Should delete change request', async () => {
        await classService.deleteElectiveChange((await Container.get(RequestChangeRepository).find('', ''))[0].id as string);
    });

    it('Should confirm change request', async () => {
        const items = await classService.getValidRequestElectives(users[0].id as string);
        const activeClasses = await classService.getActiveClasses(users[0].id as string);
        await classService.addElectiveChange({
            from: activeClasses[0].elective.id as string,
            to: items[0].id as string
        }, users[0].id as string);
        await classService.confirmElectiveChange((await Container.get(RequestChangeRepository).find('', ''))[0].id as string);
    });
});
