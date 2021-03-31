import {ClassRepository, IClassModel} from '../../models/mongo/class-repository';
import {BaseService} from '../../models/shared/base-service';
import {inject} from 'inversify';
import {ProvideSingleton} from '../../shared/provide-singleton';
import {IUserModel, UserRepository} from '../../models/mongo/user-repository';
import {IFormModel} from '../../models/mongo/form-repository';
import {chunkArray} from '../../util/general-util';
import {NotificationService} from '../notification/service';

@ProvideSingleton(ClassService)
export class ClassService extends BaseService<IClassModel> {
    constructor(
        @inject(ClassRepository) protected repository: ClassRepository,
        @inject(UserRepository) protected userRepository: UserRepository,
        @inject(NotificationService) protected notificationService: NotificationService
    ) {
        super();
    }

    public async createClass(electiveMap: Map<string, { count: number, users: IUserModel[] }>, form: IFormModel) {
        for (const elective of form.electives) {
            for (const batch of elective.batches) {
                // @ts-ignore
                const studentArr = electiveMap.get(batch.batchString + elective.courseCode + elective.version).users.map(e => e.id);
                if (studentArr.length > 0) {
                    const students = chunkArray(studentArr, elective.teachers.length);
                    for (const [i, chunk] of students.entries()) {
                        const classId = await this.repository.addClass({
                            // @ts-ignore
                            elective: elective.id,
                            // @ts-ignore
                            batch: batch.id,
                            students: chunk,
                            teacher: elective.teachers[i]
                        });
                        await this.userRepository.addClassToStudents(chunk, classId);
                        this.notificationService.notifyUsers(chunk, {
                            notification: {
                                title: 'You have been added to a new class!',
                                body: `Joined: ${elective.name}`,
                                vibrate: [100, 50, 100],
                                requireInteraction: true,
                                actions: [{
                                    action: `classes/${classId}`,
                                    title: 'Go to class'
                                }]
                            }
                        }).then().catch();
                    }
                }
            }
        }
    }
}
