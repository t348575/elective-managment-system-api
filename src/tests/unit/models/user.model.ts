import { IUserModel, UserFormatter, UserRepository } from '../../../models/mongo/user-repository';
import faker from 'faker';
import { scopes } from '../../../models/types';
import { BatchRepository, batchStringToModel } from '../../../models/mongo/batch-repository';

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
export async function setupMockBatches(count: number): Promise<string[]> {
    const batches = getMockBatches(count);
    const batchIds: string[] = [];
    const batchRepository = Container.get(BatchRepository);
    for (let i = 0; i < count; i++) {
        try {
            await batchRepository.create(batchStringToModel(batches[i]));
        } catch(err) {}
        // @ts-ignore
        batchIds.push((await batchRepository.findOne({ batchString: batches[i] })).id);
    }
    return batchIds;
}

export function getMockBatches(count: number): string[] {
    let batches: string[] = [];
    let i = 0;
    while (i < count) {
        const year = faker.date.past(faker.datatype.number({ min: 1, max: 6 })).getFullYear();
        const fromNow = new Date().getFullYear() - year;
        batches.push(`${year}-${fromNow}-BTECH-CSE`);
        i++;
        const temp: string[] = [...new Set(batches)];
        if (temp.length !== i) {
            i--;
            batches = temp;
        }
    }
    return batches;
}

export async function setupMockUsers(mode: 'all' | 'adminOnly' | 'adminTeachers' = 'all'): Promise<IUserModel[]> {
    globalI++;
    const userRepository = Container.get(UserRepository);
    const users: IUserModel[] = [];
    let i, j;
    switch (mode) {
        case 'all': {
            const batches = await setupMockBatches(5);
            for (i = 0, j = 0; i < 50; i++) {
                users.push(await userRepository.create(getMockUser('student', i, batches[j])));
                if (i % 10 === 0 && i !== 0) {
                    j++;
                }
            }
            for (; i < 55; i++) {
                users.push(await userRepository.create(getMockUser('teacher', i)));
            }
            for (; i < 57; i++) {
                users.push(await userRepository.create(getMockUser('admin', i)));
            }
            break;
        }
        case 'adminOnly': {
            for (i = 0; i < 2; i++) {
                users.push(await userRepository.create(getMockUser('admin', i)));
            }
            break;
        }
        case 'adminTeachers': {
            for (i = 0; i < 5; i++) {
                users.push(await userRepository.create(getMockUser('teacher', i)));
            }
            for (; i < 7; i++) {
                users.push(await userRepository.create(getMockUser('admin', i)));
            }
            break;
        }
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
