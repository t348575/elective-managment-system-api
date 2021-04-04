import { IUserModel, UserFormatter, UserRepository } from '../../../models/mongo/user-repository';
import faker from 'faker';
import { scopes } from '../../../models/types';
import { Container } from 'typescript-ioc';
import { BatchRepository, batchStringToModel } from '../../../models/mongo/batch-repository';
import { MongoConnector } from '../../../shared/mongo-connector';
export function getMockUser(scope: scopes, batch?: string): UserFormatter {
    const rollNo = getRollNo(scope);
    return new UserFormatter({
        name: faker.name.firstName(),
        username: getUsername(scope, rollNo),
        password: '$argon2i$v=19$m=4096,t=3,p=1$zEsEAoQ2dRXsc3pdFN0YDQ$nwIP+l81tJ8ERKAqpNVjHl9REWv92fq5NTsHyvHWSuA',
        rollNo,
        role: scope,
        batch,
        classes: scope === 'student' ? [] : undefined
    });
}
function getUsername(scope: scopes, rollNo: string): string {
    switch (scope) {
        case 'admin': {
            return `admin_${rollNo}@cb.staff.amrita.edu`;
        }
        case 'student': {
            return `${rollNo}@cb.students.amrita.edu`;
        }
        case 'teacher': {
            return `teacher_${rollNo}@cb.staff.amrita.edu`;
        }
    }
}
function getRollNo(scope: scopes): string {
    switch (scope) {
        case 'student': {
            return `cb.en.u4cse${faker.datatype.number()}`;
        }
        case 'admin':
        case 'teacher': {
            return `${faker.datatype.number()}`;
        }
    }
}
async function setupMockBatches(count: number): Promise<string[]> {
    const batches: string[] = [];
    const batchRepository = Container.get(BatchRepository);
    for (let i = 0; i < count; i++) {
        const year = faker.date.past(faker.datatype.number(6)).getFullYear();
        const fromNow = new Date().getFullYear() - year;
        const str = `${year}-${fromNow}-BTECH-CSE`;
        try {
            await batchRepository.create(batchStringToModel(str));
            // eslint-disable-next-line no-empty
        } catch (err) {}
        // @ts-ignore
        batches.push((await batchRepository.findOne({ batchString: str })).id);
    }
    return batches;
}

function getMockBatches(count: number): string[] {
    const batches = [];
    for (let i = 0; i < count; i++) {
        const year = faker.date.past(faker.datatype.number(6)).getFullYear();
        const fromNow = new Date().getFullYear() - year;
        batches.push(`${year}-${fromNow}-BTECH-CSE`);
    }
    return batches;
}

export async function setupMockUsers(): Promise<IUserModel[]> {
    const userRepository = Container.get(UserRepository);
    const users: IUserModel[] = [];
    const batches = await setupMockBatches(5);
    for (let i = 0, j = 0; i < 50; i++) {
        users.push(await userRepository.create(getMockUser('student', batches[j])));
        if (i % 10 === 0) {
            j++;
        }
    }
    for (let i = 0; i < 5; i++) {
        users.push(await userRepository.create(getMockUser('teacher')));
    }
    for (let i = 0; i < 2; i++) {
        users.push(await userRepository.create(getMockUser('admin')));
    }
    return users;
}

export function getMockUsers(): IUserModel[] {
    const users: IUserModel[] = [];
    const batches = getMockBatches(5);
    for (let i = 0, j = 0; i < 50; i++) {
        users.push(getMockUser('student', batches[j]));
        if ((i + 1) % 10 === 0) {
            j++;
        }
    }
    for (let i = 0; i < 5; i++) {
        users.push(getMockUser('teacher'));
    }
    for (let i = 0; i < 2; i++) {
        users.push(getMockUser('admin'));
    }
    return users;
}

export async function clearUsers(): Promise<void> {
    await Container.get(MongoConnector).db.models.users.deleteMany();
}
