import {ProvideSingleton} from '../../shared/provide-singleton';
import {FormsRepository, IFormModel} from '../../models/mongo/form-repository';
import {BaseService} from '../../models/shared/base-service';
import {inject} from 'inversify';
import {BatchRepository} from '../../models/mongo/batch-repository';
import {CreateFormOptions, UpdateFormOptions} from './controller';
import {ElectiveRepository} from '../../models/mongo/elective-repository';
import {ErrorType, UnknownApiError} from '../../shared/error-handler';
import {UserRepository} from '../../models/mongo/user-repository';
import {scopes} from '../../models/types';
import {PaginationModel} from '../../models/shared/pagination-model';
import {ResponseRepository} from '../../models/mongo/response-repository';
import mongoose from 'mongoose';

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
        @inject(ResponseRepository) protected responseRepository: ResponseRepository
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
                num: options.numElectives
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
                return (await this.repository.findActive({ end: { '$gte': new Date() }}))
                .filter(e => {
                    // @ts-ignore
                    e.electives = e.electives.filter(v => v.batches.indexOf(user.batch?.id) > -1);
                    return e.electives.length > 0;
                });
            }
            case 'admin': {
                return this.repository.findActive({ end: { '$gte': new Date() }});
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

    public async generateList(id: string, format: 'json' | 'csv', closeForm: boolean = false) {
        return this.responseRepository.find(0, undefined, '', { form: mongoose.Types.ObjectId(id) });
    }
}
