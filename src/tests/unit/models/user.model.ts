import { IUserModel, UserFormatter, UserRepository } from '../../../models/mongo/user-repository';
import faker from 'faker';
import { scopes } from '../../../models/types';
import { Container } from 'typescript-ioc';
import { BatchRepository, batchStringToModel } from '../../../models/mongo/batch-repository';
import { MongoConnector } from '../../../shared/mongo-connector';
let globalI = 0;
export function getMockUser(scope: scopes, num: number, batch?: string): UserFormatter {
    const rollNo = getRollNo(scope, num);
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
function getRollNo(scope: scopes, num: number): string {
    switch (scope) {
        case 'student': {
            return `cb.en.u4cse${globalI}${num}`;
        }
        case 'admin':
        case 'teacher': {
            return `${globalI}${num}`;
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
    globalI++;
    const userRepository = Container.get(UserRepository);
    const users: IUserModel[] = [];
    const batches = await setupMockBatches(5);
    let i, j;
    for (i = 0, j = 0; i < 50; i++) {
        users.push(await userRepository.create(getMockUser('student', i, batches[j])));
        if (i % 10 === 0) {
            j++;
        }
    }
    for (; i < 55; i++) {
        users.push(await userRepository.create(getMockUser('teacher', i)));
    }
    for (; i < 57; i++) {
        users.push(await userRepository.create(getMockUser('admin', i)));
    }
    return users;
}

export function getMockUsers(): IUserModel[] {
    globalI++;
    const users: IUserModel[] = [];
    const batches = getMockBatches(5);
    let i, j;
    for (i = 0, j = 0; i < 50; i++) {
        users.push(getMockUser('student', i, batches[j]));
        if ((i + 1) % 10 === 0) {
            j++;
        }
    }
    for (; i < 55; i++) {
        users.push(getMockUser('teacher', i));
    }
    for (; i < 57; i++) {
        users.push(getMockUser('admin', i));
    }
    return users;
}

export async function clearUsers(): Promise<void> {
    await Container.get(MongoConnector).db.models.users.deleteMany();
}
