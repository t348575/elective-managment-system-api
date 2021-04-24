import { BaseService } from '../../models/shared/base-service';
import { IResponseModel, ResponseRepository } from '../../models/mongo/response-repository';
import { Singleton, Inject } from 'typescript-ioc';
import { UserRepository } from '../../models/mongo/user-repository';
import { FormResponseOptions } from './controller';
import { jwtToken } from '../../models/types';
import { FormsRepository } from '../../models/mongo/form-repository';
import { ApiError } from '../../shared/error-handler';
import { PaginationModel } from '../../models/shared/pagination-model';
import mongoose from 'mongoose';

@Singleton
export class ResponseService extends BaseService<IResponseModel> {
    @Inject protected repository: ResponseRepository;
    @Inject private userRepository: UserRepository;
    @Inject private formsRepository: FormsRepository;
    constructor() {
        super();
    }

    public async respondToForm(options: FormResponseOptions, token: jwtToken) {
        try {
            if (await this.responseExists(token.id, options.id)) {
                throw new ApiError({
                    statusCode: 401,
                    name: 'response_registered',
                    message: 'A response has already been submitted for the selected form'
                });
            } else {
                options.electives = [...new Set(options.electives)];
                const user = await this.userRepository.getPopulated(token.id, 'student');
                const form = (await this.formsRepository.findActive({ end: { $gte: new Date() } })).filter((e) => {
                    e.electives = e.electives.filter(
                        // @ts-ignore
                        (v) => v.batches.findIndex((r) => r.id === user.batch?.id) > -1
                    );
                    return e.electives.length > 0;
                });
                const idx = form.findIndex((e) => e.id === options.id);
                if (idx > -1) {
                    const validElectives = form[idx].electives.map((v) => v.id);
                    for (const v of options.electives) {
                        if (validElectives.indexOf(v) === -1) {
                            throw new ApiError({
                                statusCode: 401,
                                name: 'elective_no_exist',
                                message: 'Elective given does not exist'
                            });
                        }
                    }
                    if (
                        (form[idx].selectAllAtForm && options.electives.length !== validElectives.length) ||
                        (!form[idx].selectAllAtForm && options.electives.length < form[idx].shouldSelect)
                    ) {
                        throw new ApiError({
                            statusCode: 401,
                            name: 'elective_num_incorrect',
                            message: 'Improper number of electives provided'
                        });
                    }
                    return this.repository.create({
                        // @ts-ignore
                        form: form[idx].id,
                        // @ts-ignore
                        responses: options.electives,
                        // @ts-ignore
                        user: user.id,
                        // @ts-ignore
                        time: new Date().toISOString()
                    });
                } else {
                    throw new ApiError({
                        statusCode: 401,
                        name: 'form_expired',
                        message: 'Requested form is no longer valid'
                    });
                }
            }
        } catch (err) {
            if (err instanceof ApiError) {
                throw err;
            } else {
                throw new ApiError({
                    statusCode: 404,
                    name: 'not_found',
                    message: 'Requested form does not exist'
                });
            }
        }
    }

    private async responseExists(userId: string, formId: string): Promise<boolean> {
        try {
            const user = await this.repository.findOne({
                user: mongoose.Types.ObjectId(userId),
                form: mongoose.Types.ObjectId(formId)
            });
            return user !== null && user !== undefined;
        } catch (err) {
            return false;
        }
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
}
