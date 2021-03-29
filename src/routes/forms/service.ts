import {ProvideSingleton} from '../../shared/provide-singleton';
import {FormFormatter, FormsRepository, IFormModel} from '../../models/mongo/form-repository';
import {BaseService} from '../../models/shared/base-service';
import {inject} from 'inversify';
import {BatchRepository} from '../../models/mongo/batch-repository';
import {CreateFormOptions, GenerateListResponse, UpdateFormOptions} from './controller';
import {ElectiveFormatter, ElectiveRepository, IElectiveModel} from '../../models/mongo/elective-repository';
import {ErrorType, UnknownApiError} from '../../shared/error-handler';
import {UserRepository} from '../../models/mongo/user-repository';
import {scopes} from '../../models/types';
import {PaginationModel} from '../../models/shared/pagination-model';
import {ResponseRepository} from '../../models/mongo/response-repository';
import mongoose from 'mongoose';
import {Request as ExRequest, Response as ExResponse} from 'express';
import {createWriteStream, unlink} from 'fs';
import * as path from 'path';
import {randomBytes} from 'crypto';
import constants from '../../constants';
import * as csv from '@fast-csv/format';
import {checkNumber} from '../../util/general-util';
import {DownloadService} from '../download/service';

export interface AssignedElective {
    rollNo: string;
    batch: string;
    electives: string[];
}

@ProvideSingleton(FormsService)
export class FormsService extends BaseService<IFormModel> {
    constructor(
        @inject(FormsRepository) protected repository: FormsRepository,
        @inject(BatchRepository) protected batchRepository: BatchRepository,
        @inject(ElectiveRepository) protected electionRepository: ElectiveRepository,
        @inject(UserRepository) protected userRepository: UserRepository,
        @inject(ResponseRepository) protected responseRepository: ResponseRepository,
        @inject(DownloadService) protected downloadService: DownloadService
    ) {
        super();
    }

    public async createForm(options: CreateFormOptions) {
        try {
            const now = new Date();
            now.setMinutes(now.getMinutes() - 5);
            if (new Date(options.start).getTime() <= now.getTime()) {
                return <ErrorType>{
                    statusCode: 400,
                    name: 'start_time_too_early',
                    message: 'Start time before now'
                };
            }
            if (options.numElectives > options.electives.length) {
                return <ErrorType>{
                    statusCode: 400,
                    name: 'numElectives_too_few',
                    message: 'Number of electives more than electives provided'
                };
            }
            for (const v of options.electives) {
                if (await this.electionRepository.findOne({ _id: v }) === undefined) {
                    return <ErrorType>{
                        statusCode: 400,
                        name: 'elective_not_found',
                        message: v
                    };
                }
            }
            return this.repository.create({
                // @ts-ignore
                start: options.start,
                // @ts-ignore
                end: options.end,
                // @ts-ignore
                electives: options.electives,
                num: options.numElectives,
                active: true
            });
        }
        catch(err) {
            return UnknownApiError(err);
        }
    }

    public async getBatches() {
        return this.batchRepository.find(0, undefined, '{"year": "desc"}', {});
    }

    public async getActiveForms(id: string, scope: scopes) {
        switch (scope) {
            case 'student': {
                const user = await this.userRepository.getPopulated(id, 'student');
                return (await this.repository.findActive({ end: { '$gte': new Date() }, active: true }))
                .filter(e => {
                    // @ts-ignore
                    e.electives = e.electives.filter(v => v.batches.indexOf(user.batch?.id) > -1);
                    return e.electives.length > 0;
                });
            }
            case 'admin': {
                return this.repository.findActive({ end: { '$gte': new Date() }, active: true});
            }
        }
    }

    public async updateForm(options: UpdateFormOptions) {
        // @ts-ignore
        options._id = options.id;
        // @ts-ignore
        delete options.id;
        // @ts-ignore
        return this.repository.findAndUpdate({ _id: options._id }, options);
    }

    public async getPaginated<Entity>(
        page: number,
        limit: number,
        fields: string,
        sort: string,
        query: any
    ): Promise<PaginationModel<Entity>> {
        const skip: number = (Math.max(1, page) - 1) * limit;
        let [count, docs] = await Promise.all([
            this.repository.count(query),
            this.repository.findAndPopulate(skip, limit, sort, query)
        ]);
        const fieldArray = (fields || '').split(',').map(field => field.trim()).filter(Boolean);
        if (fieldArray.length) docs = docs.map((d: { [x: string]: any; }) => {
            const attrs: any = {};
            // @ts-ignore
            fieldArray.forEach(f => attrs[f] = d[f]);
            return attrs;
        });
        return new PaginationModel<Entity>({
            count,
            page,
            limit,
            docs,
            totalPages: Math.ceil(count / limit),
        });
    }

    public generateList(id: string, closeForm: boolean, userId: string): Promise<GenerateListResponse> {
        return new Promise<GenerateListResponse>(async (resolve, reject) => {
            const form: IFormModel = (await this.repository.findAndPopulate(0, undefined, '', {_id: id}))[0];
            const name = randomBytes(8).toString('hex');
            const filePath = path.join(__dirname, constants.directories.csvTemporary, `${name}.csv`);
            const file = createWriteStream(filePath, { encoding: 'utf8', flags: 'a' });
            const electiveCountMap = new Map<string, number>();
            const failed: string[] = [];
            for (const elective of form.electives) {
                for (const batch of elective.batches) {
                    electiveCountMap.set(batch.batchString + elective.courseCode + elective.version, 0);
                }
            }
            const selectElective = (rollNo: string, batch: string, responses: IElectiveModel[]): {elective: string, version: number} => {
                for (const ele of responses) {
                    const selection = electiveCountMap.get(batch + ele.courseCode + ele.version);
                    if (selection !== undefined && selection !== null && selection < ele.strength) {
                        electiveCountMap.set(batch + ele.courseCode + ele.version, selection + 1);
                        return {
                            elective: ele.courseCode,
                            version: ele.version
                        };
                    }
                }
                failed.push(rollNo);
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
                }
            };
            const csvStream = csv.format({ headers: true }).transform(transformer);
            this.responseRepository.findToStream('{"time":"desc"}', { form: mongoose.Types.ObjectId(id) }, csvStream, file);
            file.on('close', () => {
                (async() => {
                    if (closeForm) {
                        // @ts-ignore
                        this.repository.update(id, {
                            end: form.end,
                            start: form.start,
                            // @ts-ignore
                            electives: form.electives.map(e => e.id),
                            active: false
                        }).then().catch();
                    }
                    try {
                        const link = await this.downloadService.addTemporaryUserLink([userId], filePath);
                        resolve({
                            status: failed.length === 0,
                            downloadUri: `${constants.baseUrl}/downloads/temp?file=${link}`,
                            failed
                        });
                    }
                    catch(err) {
                        reject(err);
                    }
                })();
            });
            file.on('error', (err) => {
                reject(err);
            });
        });
    }
}
