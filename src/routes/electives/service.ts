import {ProvideSingleton} from '../../shared/provide-singleton';
import {BaseRepository} from '../../models/shared/base-repository';
import {AddElectives} from './controller';
import {ElectiveRepository, IElectiveModel} from '../../models/mongo/elective-repository';
import {inject} from 'inversify';
import {BatchRepository, batchStringToModel} from '../../models/mongo/batch-repository';
import {UserRepository} from '../../models/mongo/user-repository';
import {checkNumber, checkString} from '../../util/general-util';
import {electiveAttributes} from '../../models/types';



@ProvideSingleton(ElectivesService)
export class ElectivesService extends BaseRepository<IElectiveModel> {

    constructor(
        @inject(ElectiveRepository) protected repository: ElectiveRepository,
        @inject(BatchRepository) protected batchRepository: BatchRepository,
        @inject(UserRepository) protected userRepository: UserRepository
    ) {
        super();
    }

    private async createHelper(elective: AddElectives) {
        const batchIds = [];
        const teacherIds = [];
        // @ts-ignore
        for (const v of elective.batches) {
            const batch = batchStringToModel(v);
            try {
                await this.batchRepository.create({
                    year: batch.year,
                    numYears: batch.numYears,
                    degree: batch.degree,
                    course: batch.course,
                    batchString: batch.batchString
                });
            }
            catch (err) {}
            // @ts-ignore
            batchIds.push((await this.batchRepository.findOne({ batchString: batch.batchString })).id.toString());
        }
        // @ts-ignore
        for (const v of elective.teachers) {
            // @ts-ignore
            teacherIds.push((await this.userRepository.findOne({ role: 'teacher', rollNo: v })).id.toString());
        }
        return this.repository.create({
            name: elective.name,
            description: elective.description,
            courseCode: elective.courseCode,
            version: elective.version,
            strength: elective.strength,
            attributes: elective.attributes,
            // @ts-ignore
            batches: batchIds,
            // @ts-ignore
            teachers: teacherIds
        });
    }

    public addElectives(electives: any[]): Promise<any[]> {
        return new Promise<any[]>(async (resolve, reject) => {
            try {
                const invalid: any[] = [];
                for (const v of electives) {
                    try {
                        if (
                            checkString(v, 'name') &&
                            checkString(v, 'description') &&
                            checkString(v, 'courseCode') &&
                            checkNumber(v, 'version', true) &&
                            checkNumber(v, 'strength', true) &&
                            checkString(v, 'attributes') &&
                            checkString(v, 'batches') &&
                            checkString(v, 'teachers')
                        ) {
                            const attributes: string[] = v.attributes.split(',');
                            const batches: string[] = v.batches.split(',');
                            const teachers: string[] = v.teachers.split(',');
                            if (attributes.length === 0 || (attributes.length > 0 && attributes.length % 2 !== 0) || batches.length === 0 || teachers.length === 0) {
                                invalid.push(v);
                            }
                            else {
                                const parsedAttributes: electiveAttributes = [];
                                const n = attributes.length / 2;
                                for (let i = 0; i < n; i += 2) {
                                    parsedAttributes.push({
                                        key: attributes[i],
                                        value: attributes[i + 1]
                                    });
                                }
                                await this.createHelper({
                                    name: v.name,
                                    description: v.description,
                                    courseCode: v.courseCode,
                                    version: v.version,
                                    strength: v.strength,
                                    attributes: parsedAttributes,
                                    batches,
                                    teachers
                                });
                            }
                        }
                        else {
                            invalid.push(v);
                        }
                    }
                    catch (err) {
                        invalid.push(v);
                    }
                }
                resolve(invalid);
            }
            catch (err) {
                reject(err);
            }
        });
    }
}

