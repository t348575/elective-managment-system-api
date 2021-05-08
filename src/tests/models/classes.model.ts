import { FormsRepository, IFormModel } from '../../models/mongo/form-repository';
import { Container } from 'typescript-ioc';
import { IUserModel } from '../../models/mongo/user-repository';
import { FormsService } from '../../routes/forms/service';
import { ClassService } from '../../routes/classes/service';

export async function createClasses(form: IFormModel) {
    const formId = form.id as string;
    const currForm: IFormModel = (await Container.get(FormsRepository).findAndPopulate('', { _id: formId }, 0))[0];
    const electiveCountMap = new Map<string, { count: number; users: IUserModel[] }>();
    const { selections } = await Container.get(FormsService).rawList(formId);
    await Container.get(FormsRepository).update(formId, {
        end: currForm.end,
        start: currForm.start,
        // @ts-ignore
        electives: currForm.electives.map((e) => e.id),
        active: false
    });
    for (const v of currForm.electives) {
        electiveCountMap.set(v.courseCode + v.version, { count: 0, users: [] });
    }
    for (const v of selections) {
        if (v.electives.length > 0) {
            for (const k of v.electives) {
                const item = electiveCountMap.get(k.courseCode + k.version);
                if (item) {
                    item.count++;
                    item.users.push(v.user);
                }
            }
        }
    }
    await Container.get(ClassService).createClass(electiveCountMap, currForm);
    // @ts-ignore
    return Container.get(ClassService).getPaginated(0, undefined, '', '', '');
}
