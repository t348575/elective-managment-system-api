import faker from 'faker';
import { IUserModel } from '../../../models/mongo/user-repository';
import { Container } from 'typescript-ioc';
import { ResponseService } from '../../../routes/response/service';
import { IElectiveModel } from '../../../models/mongo/elective-repository';
import { IFormModel } from '../../../models/mongo/form-repository';

export async function respondToForm(form: IFormModel, users: IUserModel[], electives: IElectiveModel[]): Promise<string[]> {
    const responseService = Container.get(ResponseService);
    const responded: string[] = [];
    for (const v of users) {
        try {
            // @ts-ignore
            const selection = electives.filter(e => e.batches.indexOf(v.batch) > -1).map(e => e.id);
            await responseService.respondToForm({
                // @ts-ignore
                id: form.id,
                // @ts-ignore
                electives: faker.helpers.shuffle(selection)
                // @ts-ignore
            }, { id: v.id });
            responded.push(v.id as string);
        }
            // eslint-disable-next-line no-empty
        catch(err) {}
    }
    return responded;
}
