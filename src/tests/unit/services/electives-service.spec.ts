import { UnitHelper } from '../../unit-helper';
const unitHelper = new UnitHelper();
import { Container } from 'typescript-ioc';
import { setupMockUsers } from '../../models/user.model';
import { IUserModel, UserFormatter } from '../../../models/mongo/user-repository';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { ElectivesService } from '../../../routes/electives/service';
import { getMockElectives } from '../../models/electives.model';
import { PaginationModel } from '../../../models/shared/pagination-model';
import { ElectiveFormatter, IElectiveModel } from '../../../models/mongo/elective-repository';
import { BatchFormatter } from '../../../models/mongo/batch-repository';

chai.use(chaiAsPromised);
let users: IUserModel[] = [];

describe('Elective service', () => {
    before(async () => {
        await unitHelper.init();
        users = await setupMockUsers('adminTeachers');
    });
    const electivesService = Container.get(ElectivesService);

    it('Should create electives', async () => {
        const res = await electivesService.addElectives(getMockElectives(users.slice(0, 5)));
        expect(res).to.be.an('array');
        expect(res.length).to.be.equal(0);
    });

    it('Should fail elective creation by name', async () => {
        const ele = getMockElectives(users.slice(0, 5)).slice(0, 1);
        // @ts-ignore
        ele[0].name = 1;
        const res = await electivesService.addElectives(ele);
        expect(res).to.be.an('array');
        expect(res.length).to.equal(1);
        expect(res[0].reason).to.equal('name: invalid');
    });

    it('Should fail elective creation by description', async () => {
        const ele = getMockElectives(users.slice(0, 5)).slice(0, 1);
        // @ts-ignore
        ele[0].description = 1;
        const res = await electivesService.addElectives(ele);
        expect(res).to.be.an('array');
        expect(res.length).to.equal(1);
        expect(res[0].reason).to.equal('description: invalid');
    });

    it('Should fail elective creation by courseCode', async () => {
        const ele = getMockElectives(users.slice(0, 5)).slice(0, 1);
        // @ts-ignore
        ele[0].courseCode = 1;
        const res = await electivesService.addElectives(ele);
        expect(res).to.be.an('array');
        expect(res.length).to.equal(1);
        expect(res[0].reason).to.equal('courseCode: invalid');
    });

    it('Should fail elective creation by version', async () => {
        const ele = getMockElectives(users.slice(0, 5)).slice(0, 1);
        // @ts-ignore
        ele[0].version = 'asd';
        const res = await electivesService.addElectives(ele);
        expect(res).to.be.an('array');
        expect(res.length).to.equal(1);
        expect(res[0].reason).to.equal('version: invalid');
    });

    it('Should fail elective creation by attributes', async () => {
        const ele = getMockElectives(users.slice(0, 5)).slice(0, 1);
        // @ts-ignore
        ele[0].attributes = 1;
        const res = await electivesService.addElectives(ele);
        expect(res).to.be.an('array');
        expect(res.length).to.equal(1);
        expect(res[0].reason).to.equal('attributes: invalid');
    });

    it('Should fail elective creation by strength', async () => {
        const ele = getMockElectives(users.slice(0, 5)).slice(0, 1);
        // @ts-ignore
        ele[0].strength = 'asd';
        const res = await electivesService.addElectives(ele);
        expect(res).to.be.an('array');
        expect(res.length).to.equal(1);
        expect(res[0].reason).to.equal('strength: invalid');
    });

    it('Should fail elective creation by batches', async () => {
        const ele = getMockElectives(users.slice(0, 5)).slice(0, 1);
        // @ts-ignore
        ele[0].batches = 1;
        const res = await electivesService.addElectives(ele);
        expect(res).to.be.an('array');
        expect(res.length).to.equal(1);
        expect(res[0].reason).to.equal('batches: invalid');
    });

    it('Should fail elective creation by teachers', async () => {
        const ele = getMockElectives(users.slice(0, 5)).slice(0, 1);
        // @ts-ignore
        ele[0].teachers = 1;
        const res = await electivesService.addElectives(ele);
        expect(res).to.be.an('array');
        expect(res.length).to.equal(1);
        expect(res[0].reason).to.equal('teachers: invalid');
    });

    it('Should fail elective by empty attributes', async () => {
        const ele = getMockElectives(users.slice(0, 5)).slice(0, 1);
        // @ts-ignore
        ele[0].attributes = '';
        const res = await electivesService.addElectives(ele);
        expect(res).to.be.an('array');
        expect(res.length).to.equal(1);
        expect(res[0].reason).to.equal('attributes: invalid');
    });

    it('Should fail elective by empty batches', async () => {
        const ele = getMockElectives(users.slice(0, 5)).slice(0, 1);
        // @ts-ignore
        ele[0].batches = '';
        const res = await electivesService.addElectives(ele);
        expect(res).to.be.an('array');
        expect(res.length).to.equal(1);
        expect(res[0].reason).to.equal('batches: invalid');
    });

    it('Should fail elective by empty teachers', async () => {
        const ele = getMockElectives(users.slice(0, 5)).slice(0, 1);
        // @ts-ignore
        ele[0].teachers = '';
        const res = await electivesService.addElectives(ele);
        expect(res).to.be.an('array');
        expect(res.length).to.equal(1);
        expect(res[0].reason).to.equal('teachers: invalid');
    });

    it('Should create electives', async () => {
        const res = await electivesService.addElectives(getMockElectives(users.slice(0, 5)));
        expect(res).to.be.an('array');
        expect(res.length).to.be.equal(0);
    });

    it('Should return electives', async () => {
        const limit = 3;
        const page = 0;
        const res = await electivesService.getPaginated(page, limit, '', '', '');
        expect(res).to.be.instanceof(PaginationModel);
        expect(res.count).to.equal(10);
        expect(res.page).to.be.equal(page);
        expect(res.totalPages).to.be.equal(4);
        expect(res.docs.length).to.be.equal(limit);
        expect(res.docs[0]).to.be.instanceof(ElectiveFormatter);
        const firstElement = <IElectiveModel>res.docs[0];
        expect(firstElement.batches).to.be.an('array');
        expect(firstElement.batches.length).to.be.greaterThan(0);
        expect(new BatchFormatter(firstElement.batches[0])).to.deep.equal(firstElement.batches[0]);
        expect(firstElement.teachers).to.be.an('array');
        expect(firstElement.teachers.length).to.be.greaterThan(0);
        expect(firstElement.teachers[0]).to.not.have.property('password');
    });

    it('Should update electives', async () => {
        const electives: PaginationModel<IElectiveModel> = await electivesService.getPaginated(0, 25, '', '', '');
        await electivesService.updateElective(electives.docs[0].id as string,
            {
                id: electives.docs[0].id as string,
                batches: ['2019-4-ASD-RES'],
                teachers: [users[0].rollNo as string],

            }
        );
    });

    it('Should get user batch', async () => {
        const res = await electivesService.getUserBatch(users[0].id as string);
        expect(res).to.be.instanceof(UserFormatter);
    });
});
