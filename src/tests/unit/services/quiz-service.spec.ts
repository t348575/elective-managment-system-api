import { UnitHelper } from '../../unit-helper';
const unitHelper = new UnitHelper();
import { Container } from 'typescript-ioc';
import { setupMockUsers } from '../../models/user.model';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { IUserModel } from '../../../models/mongo/user-repository';
import { IElectiveModel } from '../../../models/mongo/elective-repository';
import { setupMockElectives } from '../../models/electives.model';
import { IFormModel } from '../../../models/mongo/form-repository';
import { NotificationService } from '../../../routes/notification/service';
import { MockNotificationService } from '../../mocks/mock-notification-service';
import { DownloadService } from '../../../routes/download/service';
import { MockDownloadService } from '../../mocks/mock-download-service';
import { createForm } from '../../models/form.model';
import { respondToForm } from '../../models/response.model';
import { createClasses } from '../../models/classes.model';
import { IClassModel } from '../../../models/mongo/class-repository';
import { QuizzesService } from '../../../routes/quizzes/service';
import { getMockOptions, getMockQuiz } from '../../mocks/mock-quiz';
import * as faker from 'faker';
import { IQuestionModel, QuizRepository } from '../../../models/mongo/quiz-repository';
import { decipherJWT, getArgonHash } from '../../../util/general-util';
import mongoose from 'mongoose';
import { QuizResponseRepository } from '../../../models/mongo/quiz-response-repository';
import { quizToken } from '../../../models/types';
import { PaginationModel } from '../../../models/shared/pagination-model';

chai.use(chaiAsPromised);

let users: IUserModel[] = [];
let electives: IElectiveModel[] = [];
let form: IFormModel;
let classes: IClassModel[] = [];

describe('Quiz service', () => {

    before(async () => {
        await unitHelper.init();
        Container.bind(NotificationService).to(MockNotificationService);
        Container.bind(DownloadService).to(MockDownloadService);
        users = await setupMockUsers();
        electives = await setupMockElectives(users.slice(50, 56));
        form = await createForm(electives);
        await respondToForm(form, users, electives);
        classes = (await createClasses(form)).docs as IClassModel[];
    });

    const quizService = Container.get(QuizzesService);

    describe('Create quiz', () => {

        it('Should create a quiz with time', async () => {
            const start = new Date();
            const end = new Date();
            end.setMinutes(end.getMinutes() + 15);
            await quizService.createQuiz(getMockQuiz(), {
                classItem: classes[0].id as string,
                name: faker.random.words(3),
                start: start.toISOString(),
                end: end.toISOString(),
                time: 3
            });
            expect(await Container.get(QuizRepository).find('', '')).to.be.an('array').and.have.length(1);
        });

        it('Should create a quiz with no time', async () => {
            const start = new Date();
            const end = new Date();
            end.setMinutes(end.getMinutes() + 15);
            await quizService.createQuiz(getMockQuiz(), {
                classItem: classes[0].id as string,
                name: faker.random.words(3),
                start: start.toISOString(),
                end: end.toISOString(),
                time: 0
            });
            expect(await Container.get(QuizRepository).find('', '')).to.be.an('array').and.have.length(2);
        });

        it('Should create a quiz with password', async () => {
            const start = new Date();
            const end = new Date();
            end.setMinutes(end.getMinutes() + 15);
            await quizService.createQuiz(getMockQuiz(), {
                password: await getArgonHash('test_password'),
                classItem: classes[0].id as string,
                name: faker.random.words(3),
                start: start.toISOString(),
                end: end.toISOString(),
                time: 3
            });
            expect(await Container.get(QuizRepository).find('', '')).to.be.an('array').and.have.length(3);
        });

        it('It should fail with improper options', async () => {
            const start = new Date();
            const end = new Date();
            end.setMinutes(end.getMinutes() + 15);
            try {
                await quizService.createQuiz([{
                    question: faker.random.words(5),
                    points: faker.datatype.number({ min: 0, max: 10 }),
                    negativePoints: faker.datatype.number({ min: -5, max: 5 }),
                    answer: faker.datatype.number({ min: 1, max: 2 })
                }], {
                    password: await getArgonHash(faker.random.word()),
                    classItem: classes[0].id as string,
                    name: faker.random.words(3),
                    start: start.toISOString(),
                    end: end.toISOString(),
                    time: 3
                });
                expect.fail('Expected an error!');
            }
            catch(err) {
                expect(err.name).to.equal('improper_format');
            }
        });

        it('It should fail with question', async () => {
            const start = new Date();
            const end = new Date();
            end.setMinutes(end.getMinutes() + 15);
            try {
                await quizService.createQuiz([{
                    question: 3,
                    points: faker.datatype.number({ min: 0, max: 10 }),
                    negativePoints: faker.datatype.number({ min: -5, max: 5 }),
                    ...getMockOptions()
                }], {
                    password: await getArgonHash(faker.random.word()),
                    classItem: classes[0].id as string,
                    name: faker.random.words(3),
                    start: start.toISOString(),
                    end: end.toISOString(),
                    time: 3
                });
                expect.fail('Expected an error!');
            }
            catch(err) {
                expect(err.name).to.equal('question_no_exist');
            }
        });

        it('It should fail with points', async () => {
            const start = new Date();
            const end = new Date();
            end.setMinutes(end.getMinutes() + 15);
            try {
                await quizService.createQuiz([{
                    question: faker.random.words(5),
                    points: '',
                    negativePoints: faker.datatype.number({ min: -5, max: 5 }),
                    ...getMockOptions()
                }], {
                    password: await getArgonHash(faker.random.word()),
                    classItem: classes[0].id as string,
                    name: faker.random.words(3),
                    start: start.toISOString(),
                    end: end.toISOString(),
                    time: 3
                });
                expect.fail('Expected an error!');
            }
            catch(err) {
                expect(err.name).to.equal('points_err');
            }
        });

        it('It should fail with negativePoints', async () => {
            const start = new Date();
            const end = new Date();
            end.setMinutes(end.getMinutes() + 15);
            try {
                await quizService.createQuiz([{
                    question: faker.random.words(5),
                    points: faker.datatype.number({ min: 0, max: 10 }),
                    negativePoints: '',
                    ...getMockOptions()
                }], {
                    password: await getArgonHash(faker.random.word()),
                    classItem: classes[0].id as string,
                    name: faker.random.words(3),
                    start: start.toISOString(),
                    end: end.toISOString(),
                    time: 3
                });
                expect.fail('Expected an error!');
            }
            catch(err) {
                expect(err.name).to.equal('neg_points_err');
            }
        });

        it('It should fail with answer', async () => {
            const start = new Date();
            const end = new Date();
            end.setMinutes(end.getMinutes() + 15);
            try {
                await quizService.createQuiz([{
                    question: faker.random.words(5),
                    points: faker.datatype.number({ min: 0, max: 10 }),
                    negativePoints: faker.datatype.number({ min: -5, max: 5 }),
                    ...getMockOptions(),
                    answer: ''
                }], {
                    password: await getArgonHash(faker.random.word()),
                    classItem: classes[0].id as string,
                    name: faker.random.words(3),
                    start: start.toISOString(),
                    end: end.toISOString(),
                    time: 3
                });
                expect.fail('Expected an error!');
            }
            catch(err) {
                expect(err.name).to.equal('answer_err');
            }
        });

        it('It should fail with improper answer', async () => {
            const start = new Date();
            const end = new Date();
            end.setMinutes(end.getMinutes() + 15);
            try {
                await quizService.createQuiz([{
                    question: faker.random.words(5),
                    points: faker.datatype.number({ min: 0, max: 10 }),
                    negativePoints: faker.datatype.number({ min: -5, max: 5 }),
                    ...getMockOptions(),
                    answer: 0
                }], {
                    password: await getArgonHash(faker.random.word()),
                    classItem: classes[0].id as string,
                    name: faker.random.words(3),
                    start: start.toISOString(),
                    end: end.toISOString(),
                    time: 3
                });
                expect.fail('Expected an error!');
            }
            catch(err) {
                expect(err.name).to.equal('answer_err');
            }
        });

        it('It should fail with improper answer', async () => {
            const start = new Date();
            const end = new Date();
            end.setMinutes(end.getMinutes() + 15);
            try {
                await quizService.createQuiz([{
                    question: faker.random.words(5),
                    points: faker.datatype.number({ min: 0, max: 10 }),
                    negativePoints: faker.datatype.number({ min: -5, max: 5 }),
                    ...getMockOptions(),
                    answer: 100
                }], {
                    password: await getArgonHash(faker.random.word()),
                    classItem: classes[0].id as string,
                    name: faker.random.words(3),
                    start: start.toISOString(),
                    end: end.toISOString(),
                    time: 3
                });
                expect.fail('Expected an error!');
            }
            catch(err) {
                expect(err.name).to.equal('answer_err');
            }
        });

        it('It should fail with improper start time', async () => {
            const start = new Date();
            const end = new Date();
            end.setMinutes(end.getMinutes() + 15);
            start.setMinutes(start.getMinutes() + 16);
            try {
                await quizService.createQuiz(getMockQuiz(), {
                    password: await getArgonHash(faker.random.word()),
                    classItem: classes[0].id as string,
                    name: faker.random.words(3),
                    start: start.toISOString(),
                    end: end.toISOString(),
                    time: 3
                });
                expect.fail('Expected an error!');
            }
            catch(err) {
                expect(err.name).to.equal('start_end_err');
            }
        });

        it('It should fail with improper quiz time', async () => {
            const start = new Date();
            const end = new Date();
            end.setMinutes(end.getMinutes() + 15);
            try {
                await quizService.createQuiz(getMockQuiz(), {
                    password: await getArgonHash(faker.random.word()),
                    classItem: classes[0].id as string,
                    name: faker.random.words(3),
                    start: start.toISOString(),
                    end: end.toISOString(),
                    time: -321
                });
                expect.fail('Expected an error!');
            }
            catch(err) {
                expect(err.name).to.equal('improper_time');
            }
        });

        it('It should fail with improper quiz time', async () => {
            const start = new Date();
            const end = new Date();
            end.setMinutes(end.getMinutes() + 15);
            try {
                await quizService.createQuiz(getMockQuiz(), {
                    password: await getArgonHash(faker.random.word()),
                    classItem: classes[0].id as string,
                    name: faker.random.words(3),
                    start: start.toISOString(),
                    end: end.toISOString(),
                    time: 16
                });
                expect.fail('Expected an error!');
            }
            catch(err) {
                expect(err.name).to.equal('improper_time');
            }
        });

        it('It should fail with invalid class', async () => {
            const start = new Date();
            const end = new Date();
            end.setMinutes(end.getMinutes() + 15);
            try {
                await quizService.createQuiz(getMockQuiz(), {
                    password: await getArgonHash(faker.random.word()),
                    classItem: mongoose.Types.ObjectId().toString(),
                    name: faker.random.words(3),
                    start: start.toISOString(),
                    end: end.toISOString(),
                    time: 3
                });
                expect.fail('Expected an error!');
            }
            catch(err) {
                expect(err.name).to.equal('class_err');
            }
        });

    });

    describe('Get new quizzes', () => {

        it('Should return new quizzes for a student', async () => {
            const res = await quizService.getNewQuizzes(classes[0].id as string, classes[0].students[0] as never as string, 'student');
            expect(res).to.be.an('array').and.have.length.greaterThan(0);
            expect(res[0].password).to.have.length.lessThan(2);
            expect(res[0].questions).to.be.a('number');
        });

        it('Should return new quizzes for a teacher', async () => {
            const res = await quizService.getNewQuizzes(classes[0].id as string, classes[0].teacher.id as never as string, 'student');
            expect(res).to.be.an('array').and.have.length.greaterThan(0);
            expect(res[0].password).to.have.length.lessThan(2);
            expect(res[0].questions).to.be.a('number');
        });

        it('Should fail to new quizzes for a student by bad class', async () => {
            try {
                await quizService.getNewQuizzes(classes.filter(e => e.students.indexOf(classes[0].students[0]) === -1)[0].id as string, classes[0].students[0] as never as string, 'student');
                expect.fail('Expected an error!');
            }
            catch(err) {
                expect(err.name).to.equal('Forbidden');
            }
        });

    });

    describe('Get old quizzes', () => {

        it('Should return old quizzes', async () => {
            const res = await quizService.getOldQuizzes(classes[0].id as string, classes[0].students[0] as never as string);
            expect(res).to.be.an('array');
        });

        it('Should fail to get old quizzes by bad class', async () => {
            try {
                await quizService.getOldQuizzes(classes.filter(e => e.students.indexOf(classes[0].students[0]) === -1)[0].id as string, classes[0].students[0] as never as string);
                expect.fail('Expected an error!');
            }
            catch(err) {
                expect(err.name).to.equal('Forbidden');
            }
        });


    });

    describe('Delete quiz', () => {
        it('Should delete quiz', async () => {
            const quiz = (await Container.get(QuizRepository).find('', ''))[0];
            await quizService.deleteQuiz(quiz.id as string, classes[0].teacher.id as string);
        });

        it('Should fail to delete quiz by bad teacher', async () => {
            try {
                const quiz = (await Container.get(QuizRepository).find('', ''))[0];
                await quizService.deleteQuiz(quiz.id as string, classes[0].id as string);
                expect.fail('Expected an error!');
            }
            catch(err) {
                expect(err.name).to.equal('Forbidden');
            }
        });
    });

    describe('Update quiz', () => {

        it ('Should update quiz', async () => {
            const quiz = (await Container.get(QuizRepository).find('', ''))[0];
            await quizService.updateQuiz({ quizId: quiz.id as string, name: 'new quiz name' }, classes[0].teacher.id as string);
        });

        it('Should update quiz password', async () => {
            const quiz = (await Container.get(QuizRepository).find('', ''))[0];
            await quizService.updateQuiz({ quizId: quiz.id as string, password: 'new quiz password' }, classes[0].teacher.id as string);
        });

        it ('Should fail to update quiz by bad teacher', async () => {
            try {
                const quiz = (await Container.get(QuizRepository).find('', ''))[0];
                await quizService.updateQuiz({ quizId: quiz.id as string, name: 'new quiz name' }, classes[0].id as string);
                expect.fail('Expected an error!');
            }
            catch(err) {
                expect(err.name).to.equal('Forbidden');
            }
        });
    });

    describe('Start quiz', () => {

        afterEach(async () => {
            const quizzes = (await Container.get(QuizRepository).find('', ''));
            for (const v of quizzes) {
                await Container.get(QuizResponseRepository).deleteQuizResponses(v.id as string);
            }
        });

        it('Should start the quiz', async () => {
            const quiz = (await Container.get(QuizRepository).find('', ''))[0];
            const res = await quizService.startQuiz({ quizId: quiz.id as string, password: 'new quiz password' }, classes[0].students[0] as never as string);
            expect(res).to.have.property('question').and.be.an('object');
            expect(res).to.have.property('nextRequest').and.be.a('string');
            expect(res).to.have.property('endAt').and.be.a('string');
            expect(new Date(res.endAt)).to.be.instanceof(Date);
        });

        it('Should fail with improper class', async () => {
            try {
                const quiz = (await Container.get(QuizRepository).find('', ''))[0];
                await quizService.startQuiz({ quizId: quiz.id as string, password: 'new quiz password' }, classes.filter(e => e.students.indexOf(classes[0].students[0]) === -1)[0].students[0] as never as string);
                expect.fail('Expected an error!');
            }
            catch(err) {
                expect(err.name).to.equal('Forbidden');
            }
        });

        it('Should fail with improper password', async () => {
            try {
                const quiz = (await Container.get(QuizRepository).find('', ''))[0];
                await quizService.startQuiz({ quizId: quiz.id as string, password: 'password' }, classes[0].students[0] as never as string);
                expect.fail('Expected an error!');
            }
            catch(err) {
                expect(err.name).to.equal('password_incorrect');
            }
        });

        it('Should fail with no password given', async () => {
            try {
                const quiz = (await Container.get(QuizRepository).find('', ''))[0];
                await quizService.startQuiz({ quizId: quiz.id as string }, classes[0].students[0] as never as string);
                expect.fail('Expected an error!');
            }
            catch(err) {
                expect(err.name).to.equal('password_no_exist');
            }
        });

        it('Should continue quiz', async () => {
            const quiz = (await Container.get(QuizRepository).find('', ''))[0];
            await quizService.startQuiz({ quizId: quiz.id as string, password: 'new quiz password' }, classes[0].students[0] as never as string);
            await quizService.startQuiz({ quizId: quiz.id as string, password: 'new quiz password' }, classes[0].students[0] as never as string);
        });

    });

    describe('Quiz navigation', () => {
        let nextTokens: { question: IQuestionModel; nextRequest: string; endAt: string };
        before(async () => {
            const quiz = (await Container.get(QuizRepository).find('', ''))[0];
            nextTokens = await quizService.startQuiz({ quizId: quiz.id as string, password: 'new quiz password' }, classes[0].students[0] as never as string);
        });

        it('Should get second question', async () => {
            const res = await quizService.getQuestion(2, await decipherJWT(nextTokens.nextRequest, 'quiz') as never as quizToken, 'next', 1);
            expect(res).to.have.property('question').and.be.an('object');
            expect(res).to.have.property('nextRequest').and.be.a('string');
            expect(res).to.have.property('endAt').and.be.a('string');
            expect(new Date(res.endAt)).to.be.instanceof(Date);
            // @ts-ignore
            nextTokens = res;
        });

        it('Should get first question', async () => {
            const res = await quizService.getQuestion(1, await decipherJWT(nextTokens.nextRequest, 'quiz') as never as quizToken, 'prev', 1);
            expect(res).to.have.property('question').and.be.an('object');
            expect(res).to.have.property('nextRequest').and.be.a('string');
            expect(res).to.have.property('endAt').and.be.a('string');
            expect(new Date(res.endAt)).to.be.instanceof(Date);
            // @ts-ignore
            nextTokens = res;
        });

        it('Should fail to get third question', async () => {
            try {
                await quizService.getQuestion(3, await decipherJWT(nextTokens.nextRequest, 'quiz') as never as quizToken, 'next', 1);
                expect.fail('Expected an error!');
            }
            catch(err) {
                expect(err.name).to.equal('answer_mismatch');
            }
        });

        it('Should fail to get deleted quiz', async () => {
            const quiz = (await Container.get(QuizRepository).find('', ''))[0];
            await quizService.deleteQuiz(quiz.id as string, classes[0].teacher.id as string);
            try {
                await quizService.getQuestion(2, await decipherJWT(nextTokens.nextRequest, 'quiz') as never as quizToken, 'next', 1);
                expect.fail('Expected an error!');
            }
            catch(err) {
                expect(err.name).to.equal('Not Found');
            }
        });

        it('Should submit quiz', async () => {
            const quiz = (await Container.get(QuizRepository).find('', ''))[0];
            nextTokens = await quizService.startQuiz({ quizId: quiz.id as string, password: 'test_password' }, classes[0].students[0] as never as string);
            // @ts-ignore
            for (let i = 0; i < quiz.questions as never as number; i++) {
                // @ts-ignore
                nextTokens = await quizService.getQuestion(i += 2, await decipherJWT(nextTokens.nextRequest, 'quiz') as never as quizToken, 'next', 1);
            }
            await quizService.submitQuiz(await decipherJWT(nextTokens.nextRequest, 'quiz') as never as quizToken);
        });

    });

    describe('Publish scores', () => {

        it('Should publish scores', async () => {
            const quiz = (await Container.get(QuizRepository).find('', ''))[0];
            await quizService.publishScores(quiz.id as string, classes[0].teacher.id as string);
        });

        it('Should fail to publish scores by bad teacher', async () => {
            const quiz = (await Container.get(QuizRepository).find('', ''))[0];
            try {
                await quizService.publishScores(quiz.id as string, classes[0].id as string);
                expect.fail('Expected an error!');
            }
            catch(err) {
                expect(err.name).to.equal('Forbidden');
            }
        });

    });

    describe('Get results', () => {

        it('Should publish scores', async () => {
            const quiz = (await Container.get(QuizRepository).find('', ''))[0];
            const res = await quizService.getResults(0, 25, quiz.id as string, classes[0].teacher.id as string);
            expect(res).to.be.instanceof(PaginationModel);
        });

        it('Should fail to publish scores by bad teacher', async () => {
            const quiz = (await Container.get(QuizRepository).find('', ''))[0];
            try {
                await quizService.getResults(0, 25, quiz.id as string, classes[0].id as string);
                expect.fail('Expected an error!');
            }
            catch(err) {
                expect(err.name).to.equal('Forbidden');
            }
        });

    });
});
