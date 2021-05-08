import { ExplicitElectives, FormsRepository, IFormModel } from '../../models/mongo/form-repository';
import { BaseService } from '../../models/shared/base-service';
import { BatchRepository } from '../../models/mongo/batch-repository';
import { AddExplicitOptions, CreateFormOptions, GenerateListResponse, UpdateFormOptions } from './controller';
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
import { DownloadService } from '../download/service';
import { NotificationService } from '../notification/service';
import { AsyncParser } from 'json2csv';
import { ClassService } from '../classes/service';
import { Inject, Singleton } from 'typescript-ioc';
import { removeFile } from '../../util/general-util';

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
                selectAllAtForm: options.shouldSelectAll,
                explicit: []
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
                const forms = (await this.repository.findActive()).filter((e) => {
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
                return this.repository.findActive();
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
        const skip: number = Math.max(0, page) * limit;
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

    public async generateList(id: string, closeForm: boolean, userId: string): Promise<GenerateListResponse> {
        return new Promise<GenerateListResponse>(async (resolve, reject) => {
            const name = randomBytes(8).toString('hex');
            const filePath = path.join(__dirname, constants.directories.csvTemporary, `${name}.csv`);
            const file = createWriteStream(filePath, {
                encoding: 'utf8',
                flags: 'w+'
            });
            const { selections, unresponsive, failed } = await this.rawList(id);
            const fields = ['rollNo', 'elective', 'version', 'batch'];
            const opts = { fields };
            const asyncSelectionsParser = new AsyncParser(opts);
            asyncSelectionsParser.processor.on('data', (chunk) => file.write(chunk.toString()));
            asyncSelectionsParser.processor.on('error', (err) => {
                file.close();
                removeFile(filePath);
                reject(UnknownApiError(err));
            });
            asyncSelectionsParser.processor.on('end', () => {
                const fields = ['rollNo'];
                const opts = { fields };
                const asyncUnresponsiveParser = new AsyncParser(opts);
                asyncUnresponsiveParser.processor.on('data', (chunk) => file.write(chunk.toString()));
                asyncUnresponsiveParser.processor.on('error', (err) => {
                    file.close();
                    removeFile(filePath);
                    reject(UnknownApiError(err));
                });
                asyncUnresponsiveParser.processor.on('end', () => {
                    const fields = ['rollNo'];
                    const opts = { fields };
                    const asyncFailedParser = new AsyncParser(opts);
                    asyncFailedParser.processor.on('data', (chunk) => file.write(chunk.toString()));
                    asyncFailedParser.processor.on('error', (err) => {
                        file.close();
                        removeFile(filePath);
                        reject(UnknownApiError(err));
                    });
                    asyncFailedParser.processor.on('end', async () => {
                        const link = await this.downloadService.addTemporaryUserLink([userId], filePath, name);
                        resolve({
                            status: failed.length === 0,
                            downloadUri: `${constants.baseUrl}/downloads/temp?file=${link}`,
                            failed
                        });
                    });
                    file.write('\n\nFailed users:\n');
                    for (const v of failed) {
                        asyncFailedParser.input.push(JSON.stringify({ rollNo: v.item }));
                    }
                    asyncFailedParser.input.push(null);
                });
                file.write('\n\nUnresponsive users:\n');
                for (const v of unresponsive) {
                    asyncUnresponsiveParser.input.push(JSON.stringify({ rollNo: v.rollNo }));
                }
                asyncUnresponsiveParser.input.push(null);
            });
            for (const v of selections) {
                for (const k of v.electives) {
                    asyncSelectionsParser.input.push(
                        JSON.stringify({
                            rollNo: v.user.rollNo,
                            elective: k.name,
                            version: k.version,
                            batch: v.user.batch?.batchString
                        })
                    );
                }
            }
            asyncSelectionsParser.input.push(null);
        });
    }

    public async createClass(
        formId: string
    ): Promise<{
        failed: Failed[];
        successful: string[];
        unresponsive: string[];
    }> {
        const form: IFormModel = (await this.repository.findAndPopulate('', { _id: formId }, 0))[0];
        const electiveCountMap = new Map<string, { count: number; users: IUserModel[] }>();
        const { selections, unresponsive, failed } = await this.rawList(formId);
        const successful: string[] = [];
        await this.repository.update(formId, {
            end: form.end,
            start: form.start,
            // @ts-ignore
            electives: form.electives.map((e) => e.id),
            active: false
        });
        for (const v of form.electives) {
            electiveCountMap.set(v.courseCode + v.version, { count: 0, users: [] });
        }
        for (const v of selections) {
            if (v.electives.length > 0) {
                successful.push(v.user.rollNo);
                for (const k of v.electives) {
                    const item = electiveCountMap.get(k.courseCode + k.version);
                    if (item) {
                        item.count++;
                        item.users.push(v.user);
                    }
                }
            }
        }
        await this.classService.createClass(electiveCountMap, form);
        return {
            failed,
            successful,
            unresponsive: unresponsive.map((e) => e.rollNo)
        };
    }

    private async getUnresponsive(responsive: string[], batches: string[], failed: Failed[]) {
        const totalUsers = await this.userRepository.findAndPopulate(
            '',
            { batch: { $in: batches }, role: 'student' },
            0,
            undefined
        );
        return totalUsers
            .filter((e) => responsive.indexOf(e.rollNo) === -1)
            .filter((e) => failed.findIndex((r) => r.item === e.rollNo) === -1);
    }

    public async setExplicit(options: AddExplicitOptions) {
        return this.repository.setExplicit(options.id, options.options);
    }

    public async rawList(
        id: string
    ): Promise<{
        selections: { user: IUserModel; electives: IElectiveModel[] }[];
        unresponsive: IUserModel[];
        failed: Failed[];
        vacancy: { elective: IElectiveModel; vacancy: number }[];
    }> {
        const form: IFormModel = (await this.repository.findAndPopulate('', { _id: id }, 0))[0];
        const uniqueBatches = new Set<string>();
        const electiveCountMap = new Map<string, number>();
        const responsive: string[] = [];
        for (const elective of form.electives) {
            for (const batch of elective.batches) {
                electiveCountMap.set(elective.courseCode + elective.version, 0);
                // @ts-ignore
                uniqueBatches.add(batch.id);
            }
        }
        const responses = await this.responseRepository.findAndPopulate(
            '{"time":"asc"}',
            { form: mongoose.Types.ObjectId(id) },
            0,
            undefined
        );
        const failed: Failed[] = [];
        const selections: { user: IUserModel; electives: IElectiveModel[] }[] = [];
        for (const v of form.explicit) {
            selections.push({ user: { ...v.user }, electives: [...v.electives] });
        }
        for (const v of responses) {
            responsive.push(v.user.rollNo);
            const explicitIdx = form.explicit.findIndex((e) => e.user.id === v.user.id);
            let numSelected = explicitIdx > -1 ? form.explicit[explicitIdx].electives.length : 0;
            let selectionIdx = selections.findIndex((e) => e.user.id === v.user.id);
            if (selectionIdx === -1) {
                selections.push({ user: { ...v.user }, electives: [] });
                selectionIdx = selections.length - 1;
            }
            for (const ele of v.responses) {
                if (numSelected === form.shouldSelect) {
                    break;
                }
                // @ts-ignore
                const selection = electiveCountMap.get(ele.courseCode + ele.version);
                if (
                    selection !== undefined &&
                    selection !== null &&
                    selection < ele.strength &&
                    this.notInExplicit(explicitIdx, form.explicit, ele)
                ) {
                    electiveCountMap.set(ele.courseCode + ele.version, selection + 1);
                    selections[selectionIdx].electives.push({ ...ele });
                    numSelected++;
                }
            }
            if (numSelected !== form.shouldSelect) {
                failed.push({
                    item: v.user.rollNo,
                    reason: 'no_free_elective'
                });
            }
        }
        const unresponsive = await this.getUnresponsive(responsive, Array.from(uniqueBatches.values()), failed);
        for (const v of unresponsive) {
            if (selections.findIndex((e) => e.user.id === v.id) === -1) {
                selections.push({ user: { ...v }, electives: [] });
            }
        }
        const electiveVacancy: { elective: IElectiveModel; vacancy: number }[] = [...electiveCountMap].map((e) => {
            const ele = form.electives[form.electives.findIndex((r) => r.courseCode + r.version === e[0])];
            return {
                elective: ele,
                vacancy: ele.strength - e[1]
            };
        });
        return {
            selections: selections,
            vacancy: electiveVacancy,
            unresponsive,
            failed
        };
    }

    private notInExplicit(explicitIdx: number, explicit: ExplicitElectives[], elective: IElectiveModel): boolean {
        if (explicitIdx === -1) {
            return true;
        }
        return explicit[explicitIdx].electives.findIndex((e) => e.id === elective.id) === -1;
    }
}
