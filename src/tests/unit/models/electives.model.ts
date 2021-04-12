import { ElectiveRepository, IElectiveModel } from '../../../models/mongo/elective-repository';
import { getMockBatches } from './user.model';
import { Container } from 'typescript-ioc';
import faker from 'faker';
import { IUserModel } from '../../../models/mongo/user-repository';

export async function setupMockElectives(teachers: IUserModel[]): Promise<IElectiveModel[]> {
    const electiveRepository = Container.get(ElectiveRepository);
    const electives: IElectiveModel[] = [];
    const teacherIds = teachers.map((e) => e.id);
    for (let i = 0; i < 5; i++) {
        // @ts-ignore
        electives.push(await electiveRepository.create(getMockElective(teacherIds)));
    }
    return electives;
}

export function getMockElectives(teachers: IUserModel[]): IElectiveModel[] {
    const electives: IElectiveModel[] = [];
    const teacherIds = teachers.map((e) => e.rollNo);
    for (let i = 0; i < 5; i++) {
        // @ts-ignore
        electives.push(getMockElective(teacherIds));
    }
    return electives;
}

export function getMockElective(teachers: string[]): IElectiveModel {
    return {
        name: faker.lorem.words(3),
        description: faker.lorem.words(15),
        courseCode: faker.datatype.uuid(),
        version: faker.datatype.number({ min: 1 }),
        strength: faker.datatype.number({ min: 1, max: 100 }),
        // @ts-ignore
        attributes: faker.datatype
            .array(faker.datatype.number({ min: 1, max: 5 }))
            .map(() => `${faker.lorem.word()},${faker.lorem.word()}`)
            .join(','),
        // @ts-ignore
        batches: [
            ...new Set(
                faker.datatype
                    .array(faker.datatype.number({ min: 1, max: 5 }))
                    .map(() => faker.random.arrayElement(getMockBatches(5)))
            )
        ].join(','),
        // @ts-ignore
        teachers: [
            ...new Set(
                faker.datatype
                    .array(faker.datatype.number({ min: 1, max: 5 }))
                    .map(() => faker.random.arrayElement(teachers))
            )
        ].join(',')
    };
}
