import {ProvideSingleton} from '../../shared/provide-singleton';
import {BaseRepository} from '../../models/shared/base-repository';
import {IElectiveModel} from '../../models/mongo/elective-repository';
import {AddElectives} from './controller';

@ProvideSingleton(ElectivesService)
export class ElectivesService extends BaseRepository<IElectiveModel> {

    constructor() {
        super();
    }

    public addElectives(electives: any[]): Promise<any[]> {
        return new Promise<any[]>((resolve, reject) => {
            try {
                const invalid: any[] = [];
                for (const v of electives) {

                }
            }
            catch (err) {
                reject(err);
            }
        });
    }
}
