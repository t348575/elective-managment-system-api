import * as faker from 'faker';

export function getMockQuiz(numQuestions = 4): any[] {
    const result: any[] = [];
    for (let i = 0; i < numQuestions; i++) {
        const options = Array(faker.datatype.number({ min: 2, max: 6 }));
        for (let i = 0; i < options.length; i++) {
            options[i] = faker.random.words(2);
        }
        result.push(
            {
                question: faker.random.words(5),
                points: faker.datatype.number({ min: 0, max: 10 }),
                negativePoints: faker.datatype.number({ min: -5, max: 5 }),
                answer: faker.datatype.number({ min: 1, max: options.length }),
                ...arrayToObject(options)
            }
        );
    }
    return result;
}
export function getMockOptions() {
    const options = Array(faker.datatype.number({ min: 2, max: 6 }));
    for (let i = 0; i < options.length; i++) {
        options[i] = faker.random.words(2);
    }
    return {
        answer: faker.datatype.number({ min: 1, max: options.length }),
        ...arrayToObject(options)
    };
}
function arrayToObject(arr: any[], num = 5) {
    const res = {};
    for (const v of arr) {
        // @ts-ignore
        res[`field${num}`] = v;
        num++;
    }
    return res;
}
