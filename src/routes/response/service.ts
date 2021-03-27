import {ProvideSingleton} from '../../shared/provide-singleton';
import {BaseService} from '../../models/shared/base-service';
import {IResponseModel, ResponseRepository} from '../../models/mongo/response-repository';
import {inject} from 'inversify';
import {UserRepository} from '../../models/mongo/user-repository';
import {FormResponseOptions} from './controller';
import {jwtToken, scopes} from '../../models/types';
import {FormsRepository} from '../../models/mongo/form-repository';
import {ApiError, ErrorType} from '../../shared/error-handler';
import {PaginationModel} from '../../models/shared/pagination-model';
import mongoose from 'mongoose';

@ProvideSingleton(ResponseService)
export class ResponseService extends BaseService<IResponseModel> {
    constructor(
        @inject(ResponseRepository) protected repository: ResponseRepository,
        @inject(UserRepository) private userRepository: UserRepository,
        @inject(FormsRepository) private formsRepository: FormsRepository
    ) {
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
            }
            else {
                const user = await this.userRepository.getById(token.id);
                const form = (await this.formsRepository.findActive({ end: { '$gte': new Date() }}))
                .filter(e => {
                    // @ts-ignore
                    e.electives = e.electives.filter(v => v.batches.indexOf(user.batch?.id) > -1);
                    return e.electives.length > 0;
                });
                const idx = form.findIndex(e => e.id === options.id);
                if (idx > -1) {
                    for (const v of form[idx].electives) {
                        if (options.electives.indexOf(<string>v.id) === -1) {
                            throw new ApiError({
                                statusCode: 401,
                                name: 'elective_no_exist',
                                message: 'Elective given does not exist'
                            });
                        }
                    }
                    return this.repository.create({
                        // @ts-ignore
                        form: form[idx].id,
                        // @ts-ignore
                        responses: options.electives,
                        // @ts-ignore
                        user: user.id,
                        time: new Date()
                    });
                }
                else {
                    throw new ApiError({
                        statusCode: 401,
                        name: 'form_expired',
                        message: 'Requested form is no longer valid'
                    });
                }
            }
        }
        catch(err) {
            if (err instanceof ApiError) {
                throw err;
            }
            else {
                return <ErrorType>{
                    statusCode: 404,
                    name: 'form_not_found',
                    message: 'Requested form does not exist'
                };
            }
        }
    }

    private async responseExists(userId: string, formId: string): Promise<boolean> {
        try {
            const user = await this.repository.findOne({ user: mongoose.Types.ObjectId(userId), form: mongoose.Types.ObjectId(formId) });
            return user !== null && user !== undefined;
        }
        catch(err) {
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

}
