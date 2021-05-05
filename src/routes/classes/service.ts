import { ClassRepository, IClassModel } from '../../models/mongo/class-repository';
import { BaseService } from '../../models/shared/base-service';
import { IUserModel, UserRepository } from '../../models/mongo/user-repository';
import { IFormModel } from '../../models/mongo/form-repository';
import { chunkArray } from '../../util/general-util';
import { NotificationService } from '../notification/service';
import { Inject, Singleton } from 'typescript-ioc';
import { PaginationModel } from '../../models/shared/pagination-model';

@Singleton
export class ClassService extends BaseService<IClassModel> {
    @Inject
    protected repository: ClassRepository;
    @Inject
    protected userRepository: UserRepository;
    @Inject
    protected notificationService: NotificationService;
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
}
