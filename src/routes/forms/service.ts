import { FormsRepository, IFormModel } from '../../models/mongo/form-repository';
import { BaseService } from '../../models/shared/base-service';
import { BatchRepository } from '../../models/mongo/batch-repository';
import { CreateFormOptions, GenerateListResponse, UpdateFormOptions } from './controller';
import { ElectiveRepository, IElectiveModel } from '../../models/mongo/elective-repository';
import { ApiError, UnknownApiError } from '../../shared/error-handler';
import { IUserModel, UserRepository } from '../../models/mongo/user-repository';
import { Failed, scopes } from '../../models/types';
import { PaginationModel } from '../../models/shared/pagination-model';
import { ResponseRepository } from '../../models/mongo/response-repository';
import mongoose from 'mongoose';
import { createWriteStream } from 'fs';
import * as path from 'path';
import { randomBytes } from 'crypto';
import constants from '../../constants';
import * as csv from '@fast-csv/format';
import { DownloadService } from '../download/service';
import { NotificationService } from '../notification/service';
import { Parser } from 'json2csv';
import { ClassService } from '../classes/service';
import { Inject, Singleton } from 'typescript-ioc';

@Singleton
export class FormsService extends BaseService<IFormModel> {
    @Inject protected repository: FormsRepository;
    @Inject protected batchRepository: BatchRepository;
    @Inject protected electionRepository: ElectiveRepository;
    @Inject protected userRepository: UserRepository;
    @Inject protected responseRepository: ResponseRepository;
    @Inject protected downloadService: DownloadService;
    @Inject protected notificationService: NotificationService;
    @Inject protected classService: ClassService;
    constructor() {
        super();
    }

    public async createForm(options: CreateFormOptions): Promise<IFormModel> {
        try {
            const now = new Date();
            const batches = [];
            now.setMinutes(now.getMinutes() - 5);
            if (new Date(options.start).getTime() <= now.getTime()) {
                throw new ApiError({
                    statusCode: 400,
                    name: 'start_time_too_early',
                    message: 'Start time before now'
                });
            }
            if (options.numElectives > options.electives.length) {
                throw new ApiError({
                    statusCode: 400,
                    name: 'numElectives_too_few',
                    message: 'Number of electives more than electives provided'
                });
            }
            for (const v of options.electives) {
                try {
                    const ele = await this.electionRepository.findOne({ _id: v });
                    if (ele === undefined) {
                        throw new ApiError({
                            statusCode: 400,
                            name: 'not_found',
                            message: v
                        });
                    }
                    for (const k of ele.batches) {
                        batches.push(k);
                    }
                } catch (err) {
                    throw new ApiError({
                        statusCode: 400,
                        name: 'not_found',
                        message: v
                    });
                }
            }
            const createdElective = await this.repository.create({
                // @ts-ignore
                start: options.start,
                // @ts-ignore
                end: options.end,
                // @ts-ignore
                electives: options.electives,
                shouldSelect: options.numElectives,
                selectAllAtForm: options.shouldSelectAll
            });
            const s = new Set(batches);
            this.notificationService
                // @ts-ignore
                .notifyBatches(Array.from(s.values()), {
                    notification: {
                        title: 'New form available!',
                        body: `Fill new electives form before ${new Date(options.end).toLocaleString()}`,
                        vibrate: [100, 50, 100],
                        requireInteraction: true,
                        actions: [
                            {
                                action: `electives/${createdElective.id}`,
                                title: 'Go to form'
                            }
                        ]
                    }
                })
                .then()
                .catch();
            return createdElective;
        } catch (err) {
            if (err instanceof ApiError) {
                throw err;
            } else {
                throw UnknownApiError(err);
            }
        }
    }

    public async getBatches() {
        return this.batchRepository.find('{"year": "desc"}', {}, undefined, 0);
    }

    public async getActiveForms(id: string, scope: scopes) {
        switch (scope) {
            case 'student': {
                const user = await this.userRepository.getPopulated(id, 'student');
                const forms = (await this.repository.findActive({ end: { $gte: new Date() } })).filter((e) => {
                    e.electives = e.electives.filter(
                        // @ts-ignore
                        (v) => v.batches.findIndex((r) => r.id === user.batch?.id) > -1
                    );
                    return e.electives.length > 0;
                });
                const responses = await this.responseRepository.find('', {
                    user: mongoose.Types.ObjectId(id),
                    form: { $in: [...forms.map((e) => mongoose.Types.ObjectId(e.id))] }
                });
                // @ts-ignore
                return forms.filter((r) => responses.findIndex((e) => e.form === r.id) === -1);
            }
            case 'teacher':
            case 'admin': {
                return this.repository.findActive({
                    end: { $gte: new Date() }
                });
            }
        }
    }

    public async updateForm(options: UpdateFormOptions) {
        if (options.electives) {
            // @ts-ignore
            // options.electives = options.electives.map(e => mongoose.Types.ObjectId(e));
        }
        // @ts-ignore
        options._id = options.id;
        // @ts-ignore
        delete options.id;
        // @ts-ignore
        return this.repository.update(options._id, options);
    }

    public async getPaginated<Entity>(
        page: number,
        limit: number,
        fields: string,
        sort: string,
        query: any
    ): Promise<PaginationModel<Entity>> {
        const skip: number = (Math.max(1, page) - 1) * limit;
        // eslint-disable-next-line prefer-const
        let [count, docs] = await Promise.all([
            this.repository.count(query),
            this.repository.findAndPopulate(sort, query, skip, limit)
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

    public generateList(id: string, closeForm: boolean, userId: string): Promise<GenerateListResponse> {
        return new Promise<GenerateListResponse>(async (resolve, reject) => {
            const form: IFormModel = (await this.repository.findAndPopulate('', { _id: id }, 0))[0];
            const name = randomBytes(8).toString('hex');
            const filePath = path.join(__dirname, constants.directories.csvTemporary, `${name}.csv`);
            const file = createWriteStream(filePath, {
                encoding: 'utf8',
                flags: 'w+'
            });
            const electiveCountMap = new Map<string, number>();
            const failed: Failed[] = [];
            const successful: string[] = [];
            const uniqueBatches = new Set<string>();
            for (const elective of form.electives) {
                for (const batch of elective.batches) {
                    electiveCountMap.set(batch.batchString + elective.courseCode + elective.version, 0);
                    // @ts-ignore
                    uniqueBatches.add(batch.id);
                }
            }
            const selectElective = (
                rollNo: string,
                batch: string,
                responses: IElectiveModel[]
            ): { elective: string; version: number } => {
                for (const ele of responses) {
                    const selection = electiveCountMap.get(batch + ele.courseCode + ele.version);
                    if (selection !== undefined && selection !== null && selection < ele.strength) {
                        electiveCountMap.set(batch + ele.courseCode + ele.version, selection + 1);
                        successful.push(rollNo);
                        return {
                            elective: ele.courseCode,
                            version: ele.version
                        };
                    }
                }
                failed.push({
                    item: rollNo,
                    reason: 'no_space'
                });
                return {
                    elective: '',
                    version: 0
                };
            };
            const transformer = (doc: any) => {
                return {
                    rollNo: doc.user.rollNo,
                    ...selectElective(doc.user.rollNo, doc.user.batch.batchString, doc.responses),
                    batch: doc.user.batch.batchString
                };
            };
            const csvStream = csv.format({ headers: true }).transform(transformer);
            this.responseRepository.findToStream(
                '{"time":"asc"}',
                { form: mongoose.Types.ObjectId(id) },
                csvStream,
                file
            );
            file.on('close', () => {
                (async () => {
                    if (closeForm) {
                        // @ts-ignore
                        this.repository
                            .update(id, {
                                end: form.end,
                                start: form.start,
                                // @ts-ignore
                                electives: form.electives.map((e) => e.id),
                                active: false
                            })
                            .then()
                            .catch();
                    }
                    const parser = new Parser({
                        fields: ['rollNo']
                    });
                    const notFilled = (await this.getUnresponsive(successful, Array.from(uniqueBatches.values())))
                        .map((e) => e.rollNo)
                        .filter((e) => failed.findIndex((r) => r.item === e) === -1);
                    await new Promise<null>(async (resolveSuccessful) => {
                        try {
                            if (notFilled.length > 0) {
                                const csvFile = parser.parse(notFilled.map((e) => ({ rollNo: e })));
                                const writeFailed = createWriteStream(filePath, {
                                    encoding: 'utf8',
                                    flags: 'a'
                                });
                                writeFailed.write(`\n\nUnresponsive students:\n${csvFile}`, () => {
                                    writeFailed.close();
                                    resolveSuccessful(null);
                                });
                            } else {
                                resolveSuccessful(null);
                            }
                        } catch (err) {
                            resolveSuccessful(null);
                        }
                    });
                    await new Promise<null>((resolveFailed) => {
                        try {
                            if (failed.length > 0) {
                                const csvFile = parser.parse(failed.map((e) => ({ rollNo: e.item })));
                                const writeFailed = createWriteStream(filePath, {
                                    encoding: 'utf8',
                                    flags: 'a'
                                });
                                writeFailed.write(`\n\nGeneration failed for students:\n${csvFile}`, () => {
                                    writeFailed.close();
                                    resolveFailed(null);
                                });
                            } else {
                                resolveFailed(null);
                            }
                        } catch (err) {
                            resolveFailed(null);
                        }
                    });
                    try {
                        const link = await this.downloadService.addTemporaryUserLink(userId, filePath);
                        resolve({
                            status: failed.length === 0,
                            downloadUri: `${constants.baseUrl}/downloads/temp?file=${link}`,
                            failed
                        });
                    } catch (err) {
                        reject(err);
                    }
                })();
            });
            file.on('error', (err) => {
                reject(err);
            });
        });
    }

    public async createClass(formId: string) {
        const form: IFormModel = (await this.repository.findAndPopulate('', { _id: formId }, 0))[0];
        const electiveCountMap = new Map<string, { count: number; users: IUserModel[] }>();
        const failed: string[] = [];
        const successful: string[] = [];
        const uniqueBatches = new Set<string>();
        for (const elective of form.electives) {
            for (const batch of elective.batches) {
                electiveCountMap.set(batch.batchString + elective.courseCode + elective.version, {
                    users: [],
                    count: 0
                });
                // @ts-ignore
                uniqueBatches.add(batch.id);
            }
        }
        const users = await this.responseRepository.findAndPopulate(
            '{"time":"asc"}',
            {
                form: mongoose.Types.ObjectId(formId)
            },
            0
        );
        await this.repository.update(formId, {
            end: form.end,
            start: form.start,
            // @ts-ignore
            electives: form.electives.map((e) => e.id),
            active: false
        });
        for (const v of users) {
            let status = false;
            for (const ele of v.responses) {
                const selection = electiveCountMap.get(v.user.batch?.batchString + ele.courseCode + ele.version);
                if (selection !== undefined && selection !== null && selection.count < ele.strength) {
                    // @ts-ignore
                    electiveCountMap.get(v.user.batch?.batchString + ele.courseCode + ele.version).count++;
                    // @ts-ignore
                    electiveCountMap.get(v.user.batch?.batchString + ele.courseCode + ele.version).users.push(v.user);
                    successful.push(v.user.rollNo);
                    status = true;
                    break;
                }
            }
            if (!status) {
                failed.push(v.user.rollNo);
            }
        }
        const unresponsive = (await this.getUnresponsive(successful, Array.from(uniqueBatches.values()))).map(
            (e) => e.rollNo
        );
        await this.classService.createClass(electiveCountMap, form);
        return {
            failed,
            successful,
            unresponsive
        };
    }

    private async getUnresponsive(responsive: string[], batches: string[]) {
        const totalUsers = await this.userRepository.find('', { batch: { $in: batches } }, undefined, 0);
        return totalUsers.filter((e) => responsive.indexOf(e.rollNo) === -1);
    }
}
