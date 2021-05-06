import faker from 'faker';
import { Container } from 'typescript-ioc';
import { FormsService } from '../../routes/forms/service';
import { IElectiveModel } from '../../models/mongo/elective-repository';

export async function createForm(electives: IElectiveModel[]) {
    const endDate = new Date();
    const startDate = new Date();
    endDate.setDate(endDate.getDate() + faker.datatype.number({ min: 1, max: 10 }));
    return Container.get(FormsService).createForm({
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        numElectives: 2,
        // @ts-ignore
        electives: electives.map((e) => e.id),
        shouldSelectAll: false
    });
}
