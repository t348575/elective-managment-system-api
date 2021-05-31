import { ClassFormatter, ClassRepository, IClassModel } from '../../models/mongo/class-repository';
import { BaseService, paginationParser } from '../../models/shared/base-service';
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
                    await this.notificationService.notifyUsers(chunk, {
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
                    });
                }
            }
        }
    }

    public async getPaginated(
        page: number,
        limit: number,
        fields: string,
        sort: string,
        query: any
    ): Promise<PaginationModel<ClassFormatter>> {
        const skip: number = Math.max(0, page) * limit;
        // eslint-disable-next-line prefer-const
        const [count, docs] = await Promise.all([
            this.repository.count(query),
            this.repository.findAndPopulate(skip, limit, sort, query)
        ]);
        // @ts-ignore
        return paginationParser<ClassFormatter>(fields, count, docs, page, limit);
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
        return this.requestChangeRepository.create(({
            from: electiveFrom.id as string,
            to: electiveTo.id as string,
            user: userId,
            requestDate: new Date().toISOString()
        } as never) as IRequestChangeModel);
    }

    public async getElectiveChanges() {
        return this.requestChangeRepository.findAndPopulate(0, undefined, '', {});
    }

    public async deleteElectiveChange(id: string) {
        const item = (await this.requestChangeRepository.findAndPopulate(0, undefined, '', { _id: id }))[0];
        await this.notificationService.notifyUsers([item.user.id as string], {
            notification: {
                title: 'Elective change request',
                body: `Requested change from elective: ${item.from.name} to ${item.to.name} has been denied!`,
                vibrate: [100, 50, 100],
                requireInteraction: true
            }
        });
        await this.requestChangeRepository.delete(id);
    }

    public async confirmElectiveChange(id: string) {
        const item = (await this.requestChangeRepository.findAndPopulate(0, undefined, '', { _id: id }))[0];
        const userClasses = await this.getActiveClasses(item.user.id as string);
        const fromIdx = userClasses.findIndex((e) => e.elective.id === item.from.id);
        if (fromIdx > -1) {
            await this.userRepository.removeClassFromStudents(
                [item.user.id as string],
                userClasses[fromIdx].id as string
            );
            await this.repository.removeStudentFromClass(userClasses[fromIdx].id as string, item.user.id as string);
        } else {
            throw new ApiError(constants.errorTypes.notFound);
        }
        const toClass = (
            await this.repository.findAndPopulate(0, undefined, '', { elective: item.to.id as string })
        ).sort((a, b) => {
            if (a.students.length < b.students.length) {
                return -1;
            } else if (a.students.length > b.students.length) {
                return 1;
            }
            return 0;
        })[0];
        await this.userRepository.addClassToStudents([item.user.id as string], toClass.id as string);
        await this.repository.addStudentToClass(toClass.id as string, item.user.id as string);
        await this.requestChangeRepository.delete(item.id);
        await this.notificationService.notifyUsers([item.user.id as string], {
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
        });
    }

    public async getValidRequestElectives(id: string): Promise<IElectiveModel[]> {
        return (await this.canRequestElectiveChange(id))[0].electives;
    }

    public async canRequestElectiveChange(id: string) {
        const user = await this.userRepository.getPopulated(id, 'student');
        const forms = await this.formRepository.findAndPopulate(
            JSON.stringify({ end: 'desc' }),
            { active: false },
            true
        );
        return forms.filter((e) => {
            e.electives = e.electives.filter(
                // @ts-ignore
                (v) => v.batches.findIndex((r) => r.id === user.batch?.id) > -1
            );
            return e.electives.length > 0;
        });
    }
}
