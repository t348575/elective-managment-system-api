import { UnitHelper } from '../../unit-helper';
const unitHelper = new UnitHelper();
import { Container } from 'typescript-ioc';
import { setupMockUsers } from '../../models/user.model';
import { IUserModel } from '../../../models/mongo/user-repository';
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

    it('Should return electives', async () => {
        const limit = 3;
        const page = 0;
        const total = 5;
        const totalPages = Math.round(total / limit);
        const res = await electivesService.getPaginated(page, limit, '', '', '');
        expect(res).to.be.instanceof(PaginationModel);
        expect(res.count).to.be.equal(total);
        expect(res.page).to.be.equal(page);
        expect(res.totalPages).to.be.equal(totalPages);
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
});
