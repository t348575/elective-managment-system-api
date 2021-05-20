import { AddElectives, UpdateElectiveOptions } from './controller';
import { ElectiveRepository, IElectiveModel } from '../../models/mongo/elective-repository';
import { BatchRepository, batchStringToModel } from '../../models/mongo/batch-repository';
import { UserRepository } from '../../models/mongo/user-repository';
import { checkNumber, checkString } from '../../util/general-util';
import { electiveAttributes, Failed } from '../../models/types';
import { BaseService } from '../../models/shared/base-service';
import { PaginationModel } from '../../models/shared/pagination-model';
import { Inject, Singleton } from 'typescript-ioc';
import { ApiError } from '../../shared/error-handler';

@Singleton
export class ElectivesService extends BaseService<IElectiveModel> {
    @Inject
    protected repository: ElectiveRepository;
    @Inject
    protected batchRepository: BatchRepository;
    @Inject
    protected userRepository: UserRepository;
    constructor() {
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
                // eslint-disable-next-line no-empty
            } catch (err) {}
            // @ts-ignore
            batchIds.push((await this.batchRepository.findOne({ batchString: batch.batchString })).id.toString());
        }
        // @ts-ignore
        for (const v of elective.teachers) {
            teacherIds.push(
                // @ts-ignore
                (
                    await this.userRepository.findOne({
                        role: 'teacher',
                        rollNo: v.toLowerCase()
                    })
                ).id.toString()
            );
        }
        await this.repository.create({
            name: elective.name,
            description: elective.description,
            courseCode: elective.courseCode,
            version: elective.version,
            strength: elective.strength,
            attributes: elective.attributes,
            // @ts-ignore
            batches: batchIds,
            // @ts-ignore
            teachers: teacherIds,
            active: false
        });
    }

    public addElectives(electives: any[]): Promise<Failed[]> {
        return new Promise<Failed[]>(async (resolve, reject) => {
            try {
                const failed: Failed[] = [];
                for (const v of electives) {
                    try {
                        if (!checkString(v, 'name')) {
                            failed.push({
                                item: v,
                                reason: 'name: invalid'
                            });
                            continue;
                        }
                        if (!checkString(v, 'description')) {
                            failed.push({
                                item: v,
                                reason: 'description: invalid'
                            });
                            continue;
                        }
                        if (!checkString(v, 'courseCode')) {
                            failed.push({
                                item: v,
                                reason: 'courseCode: invalid'
                            });
                            continue;
                        }
                        if (!checkNumber(v, 'version', true)) {
                            failed.push({
                                item: v,
                                reason: 'version: invalid'
                            });
                            continue;
                        }
                        if (!checkNumber(v, 'strength', true)) {
                            failed.push({
                                item: v,
                                reason: 'strength: invalid'
                            });
                            continue;
                        }
                        if (!checkString(v, 'attributes')) {
                            failed.push({
                                item: v,
                                reason: 'attributes: invalid'
                            });
                            continue;
                        }
                        if (!checkString(v, 'batches')) {
                            failed.push({
                                item: v,
                                reason: 'batches: invalid'
                            });
                            continue;
                        }
                        if (!checkString(v, 'teachers')) {
                            failed.push({
                                item: v,
                                reason: 'teachers: invalid'
                            });
                            continue;
                        }
                        try {
                            const attributes: string[] = v.attributes.split(',');
                            const batches: string[] = v.batches.split(',');
                            const teachers: string[] = v.teachers.split(',');
                            if (attributes.length === 0 || (attributes.length > 0 && attributes.length % 2 !== 0)) {
                                failed.push({
                                    item: v,
                                    reason: 'attributes: invalid'
                                });
                                continue;
                            }
                            if (batches.length === 0) {
                                failed.push({
                                    item: v,
                                    reason: 'batches: empty'
                                });
                                continue;
                            }
                            if (teachers.length === 0) {
                                failed.push({
                                    item: v,
                                    reason: 'teachers: empty'
                                });
                                continue;
                            }
                            const parsedAttributes: electiveAttributes = [];
                            const n = attributes.length;
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
                                version: parseInt(v.version, 10),
                                strength: parseInt(v.strength, 10),
                                attributes: parsedAttributes,
                                batches,
                                teachers
                            });
                        } catch (err) {
                            failed.push({
                                item: v,
                                reason: 'unknown',
                                error: err
                            });
                        }
                    } catch (err) {
                        failed.push({
                            item: v,
                            reason: 'unknown',
                            error: err
                        });
                    }
                }
                resolve(failed);
            } catch (err) {
                reject(err);
            }
        });
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

    public async updateElective(id: string, model: UpdateElectiveOptions) {
        const batchIds = [];
        const teacherIds = [];
        if (model.batches) {
            for (const v of model.batches) {
                const batch = batchStringToModel(v);
                try {
                    await this.batchRepository.create({
                        year: batch.year,
                        numYears: batch.numYears,
                        degree: batch.degree,
                        course: batch.course,
                        batchString: batch.batchString
                    });
                    batchIds.push(
                        // @ts-ignore
                        (await this.batchRepository.findOne({ batchString: batch.batchString })).id.toString()
                    );
                    // eslint-disable-next-line no-empty
                } catch (err) {}
            }
            model.batches = batchIds;
        }
        if (model.teachers) {
            try {
                for (const v of model.teachers) {
                    teacherIds.push(
                        // @ts-ignore
                        (
                            await this.userRepository.findOne({
                                role: 'teacher',
                                rollNo: v.toLowerCase()
                            })
                        ).id.toString()
                    );
                }
            } catch (err) {
                throw new ApiError({
                    statusCode: 400,
                    name: 'teacher_no_exist',
                    message: err?.mesage
                });
            }
            model.teachers = teacherIds;
        }
        // @ts-ignore
        await this.update(id, model);
    }

    public getUserBatch(id: string) {
        return this.userRepository.getPopulated(id, 'student');
    }
}
