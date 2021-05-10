import { ClassRepository, IClassModel } from '../../models/mongo/class-repository';
import { BaseService } from '../../models/shared/base-service';
import { IUserModel, UserRepository } from '../../models/mongo/user-repository';
import { FormsRepository, IFormModel } from '../../models/mongo/form-repository';
import { chunkArray } from '../../util/general-util';
import { NotificationService } from '../notification/service';
import { Inject, Singleton } from 'typescript-ioc';
import { PaginationModel } from '../../models/shared/pagination-model';
import { RequestElectiveChangeOptions } from './controller';
import { ElectiveRepository, IElectiveModel } from '../../models/mongo/elective-repository';
import { IRequestChangeModel, RequestChangeRepository } from '../../models/mongo/request-change-repository';
import { ApiError } from '../../shared/error-handler';
import constants from '../../constants';

@Singleton
export class ClassService extends BaseService<IClassModel> {
    @Inject
    protected repository: ClassRepository;
    @Inject
    protected userRepository: UserRepository;
    @Inject
    protected notificationService: NotificationService;
    @Inject
    protected requestChangeRepository: RequestChangeRepository;
    @Inject
    protected electiveRepository: ElectiveRepository;
    @Inject
    protected formRepository: FormsRepository;
    constructor() {
        super();
    }

    public async createClass(electiveMap: Map<string, { count: number; users: IUserModel[] }>, form: IFormModel) {
        for (const elective of form.electives) {
            // @ts-ignore
            const studentArr = electiveMap.get(elective.courseCode + elective.version).users.map((e) => e.id);
            if (studentArr.length > 0) {
                const students = chunkArray(studentArr, elective.teachers.length);
                for (const [i, chunk] of students.entries()) {
                    const classId = await this.repository.addClass({
                        // @ts-ignore
                        elective: elective.id,
                        // @ts-ignore
                        batches: elective.batches.map((e) => e.id),
                        students: chunk,
                        // @ts-ignore
                        teacher: elective.teachers[i].id,
                        files: []
                    });
                    await this.userRepository.addClassToStudents(chunk, classId);
                    this.notificationService
                        .notifyUsers(chunk, {
                            notification: {
                                title: 'You have been added to a new class!',
                                body: `Joined: ${elective.name}`,
                                vibrate: [100, 50, 100],
                                requireInteraction: true,
                                actions: [
                                    {
                                        action: `classes/${classId}`,
                                        title: 'Go to class'
                                    }
                                ]
                            }
                        })
                        .then()
                        .catch();
                }
            }
        }
    }

    public async getPaginated<Entity>(
        page: number,
        limit: number,
        fields: string,
        sort: string,
        query: any
    ): Promise<PaginationModel<Entity>> {
        const skip: number = Math.max(0, page) * limit;
        // eslint-disable-next-line prefer-const
        let [count, docs] = await Promise.all([
            this.repository.count(query),
            this.repository.findAndPopulate(skip, limit, sort, query)
        ]);
        const fieldArray = (fields || '')
            .split(',')
            .map((field) => field.trim())
            .filter(Boolean);
        if (fieldArray.length) {
            docs = docs.map((d: { [x: string]: any }) => {
                const attrs: any = {};
                // @ts-ignore
                fieldArray.forEach((f) => (attrs[f] = d[f]));
                return attrs;
            });
        }
        return new PaginationModel<Entity>({
            count,
            page,
            limit,
            docs,
            totalPages: Math.ceil(count / limit)
        });
    }

    public async getActiveClasses(userId: string) {
        const user: IUserModel = await this.userRepository.getById(userId);
        if (user.role === 'student') {
            return this.repository.findAndPopulate(0, undefined, '', { _id: { $in: user.classes } });
        } else {
            return this.repository.findAndPopulate(0, undefined, '', { teacher: user.id });
        }
    }

    public async deleteClass(classId: string): Promise<void> {
        const classes: IClassModel = (await this.repository.findAndPopulate(0, undefined, '', { _id: classId }))[0];
        await this.userRepository.removeClassFromStudents((classes.students as unknown) as string[], classId);
        await this.repository.removeClass(classId);
    }

    public async getStudents(id: string) {
        return this.repository.getStudents(id);
    }

    public async addElectiveChange(options: RequestElectiveChangeOptions, userId: string) {
        await this.userRepository.getById(userId);
        const electiveFrom = await this.electiveRepository.getById(options.from);
        const electiveTo = await this.electiveRepository.getById(options.to);
        return this.requestChangeRepository.create({
            from: electiveFrom.id as string,
            to: electiveTo.id as string,
            user: userId,
            requestDate: new Date().toISOString()
        } as never as IRequestChangeModel);
    }

    public async getElectiveChanges() {
        return this.requestChangeRepository.findAndPopulate(0, undefined, '', {});
    }

    public async deleteElectiveChange(id: string) {
        const item = (await this.requestChangeRepository.findAndPopulate(0, undefined, '', { _id: id }))[0];
        this.notificationService.notifyUsers([item.user.id as string], {
            notification: {
                title: 'Elective change request',
                body: `Requested change from elective: ${item.from.name} to ${item.to.name}`,
                vibrate: [100, 50, 100],
                requireInteraction: true
            }
        }).then().catch();
        await this.requestChangeRepository.delete(id);
    }

    public async confirmElectiveChange(id: string) {
        const item = (await this.requestChangeRepository.findAndPopulate(0, undefined, '', { _id: id }))[0];
        const userClasses = await this.getActiveClasses(item.user.id as string);
        const fromIdx = userClasses.findIndex(e => e.id === item.from.id);
        if (fromIdx > -1) {
            await this.userRepository.removeClassFromStudents([item.user.id as string], userClasses[fromIdx].id as string);
            await this.repository.removeStudentFromClass(userClasses[fromIdx].id as string, item.user.id as string);
        }
        else {
            throw new ApiError(constants.errorTypes.notFound);
        }
        const toClass = (await this.repository.findAndPopulate(0, undefined, '', { elective: item.to.id as string })).sort((a, b) => {
            if (a.students.length < b.students.length) {
                return -1;
            }
            else if (a.students.length > b.students.length) {
                return 1;
            }
            return 0;
        })[0];
        await this.userRepository.addClassToStudents([item.user.id as string], item.to.id as string);
        await this.repository.addStudentToClass(userClasses[fromIdx].id as string, item.user.id as string);
        this.notificationService.notifyUsers([item.user.id as string], {
            notification: {
                title: 'You have been added to a new class!',
                body: `Joined: ${item.to.name}, left: ${item.from.name}`,
                vibrate: [100, 50, 100],
                requireInteraction: true,
                actions: [
                    {
                        action: `classes/${toClass.id}`,
                        title: 'Go to class'
                    }
                ]
            }
        })
        .then()
        .catch();
    }

    public async getValidRequestElectives(id: string): Promise<IElectiveModel[]> {
        return (await this.canRequestElectiveChange(id))[0].electives;
    }

    public async canRequestElectiveChange(id: string) {
        const user = await this.userRepository.getPopulated(id, 'student');
        const forms = await this.formRepository.findAndPopulate(JSON.stringify({ end: 'desc' }), { active: false }, true);
        return forms.filter((e) => {
            e.electives = e.electives.filter(
                // @ts-ignore
                (v) => v.batches.findIndex((r) => r.id === user.batch?.id) > -1
            );
            return e.electives.length > 0;
        });
    }
}
