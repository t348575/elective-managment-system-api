import { ElectiveRepository, IElectiveModel } from '../../../models/mongo/elective-repository';
import { getMockBatches } from './user.model';
import { Container } from 'typescript-ioc';
import faker from 'faker';
import { IUserModel } from '../../../models/mongo/user-repository';
import { BatchRepository } from '../../../models/mongo/batch-repository';
import { FormsService } from '../../../routes/forms/service';
import { ResponseService } from '../../../routes/response/service';

export async function setupMockElectives(teachers: IUserModel[]): Promise<IElectiveModel[]> {
    const electiveRepository = Container.get(ElectiveRepository);
    const electives: IElectiveModel[] = [];
    const batches = await Container.get(BatchRepository).find('', '', undefined, 0);
    const derivedBatches: string[][] = [];
    for (let i = 0 ; i < 5; i++) {
        // @ts-ignore
        derivedBatches.push([
            ...new Set(
                faker.datatype
                .array(faker.datatype.number({ min: 1, max: 5 }))
                .map(() => faker.random.arrayElement(batches))
                .map(e => e.id)
            )
        ]);
        if (i === 4) {
            let list: string[] = [];
            for (const v of derivedBatches) {
                list.push(...v);
            }
            list = [...new Set(list)];
            if (list.length !== 5) {
                // @ts-ignore
                const missing = batches.filter(e => list.indexOf(e.id) === -1);
                // @ts-ignore
                derivedBatches[i].push(...missing.map(e => e.id));
            }
        }
        electives.push(await electiveRepository.create({
            name: faker.lorem.words(3),
            description: faker.lorem.words(15),
            courseCode: faker.datatype.uuid(),
            version: faker.datatype.number({ min: 1 }),
            strength: faker.datatype.number({ min: 1, max: 100 }),
            // @ts-ignore
            attributes: faker.datatype
            .array(faker.datatype.number({ min: 1, max: 5 }))
            .map(() => ({key: faker.lorem.word(), value: faker.lorem.word()})),
            // @ts-ignore
            batches: derivedBatches[i],
            // @ts-ignore
            teachers: [
                ...new Set(
                    faker.datatype
                    .array(faker.datatype.number({ min: 1, max: 5 }))
                    .map(() => faker.random.arrayElement(teachers))
                    .map(e => e.id)
                )
            ]
        }));
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
        strength: faker.datatype.number({ min: 50, max: 100 }),
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

export async function sendResponsesToForms(users: IUserModel[]): Promise<void> {
    const formsService = Container.get(FormsService);
    const responseService = Container.get(ResponseService);
    for (const v of users) {
        // @ts-ignore
        const form = (await formsService.getActiveForms(v.id,'student'))[0];
        const chosen = form.electives.slice(0, form.shouldSelect).map(e => e.id);
        await responseService.respondToForm({
            // @ts-ignore
            id: form.id,
            // @ts-ignore
            electives: faker.helpers.shuffle(chosen)
        }, { id: v.id });
    }
    return;
}
