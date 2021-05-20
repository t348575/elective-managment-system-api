import { ApiError } from '../../shared/error-handler';
import constants from '../../constants';
import { PaginationModel } from './pagination-model';

export abstract class BaseService<EntityModel> {
    // @ts-ignore
    protected repository: IBaseRepository<EntityModel>;

    public async getById(_id: string): Promise<EntityModel> {
        return this.repository.findOne({ _id });
    }

    public async create(entity: EntityModel): Promise<EntityModel> {
        const res = await this.repository.create(entity);
        return this.getById((res as any)._id);
    }

    public async update(id: string, entity: EntityModel): Promise<EntityModel> {
        await this.repository.update(id, entity);
        return this.getById(id);
    }

    public async delete(id: string): Promise<void> {
        const res = await this.repository.delete(id);
        if (!res.n) {
            throw new ApiError(constants.errorTypes.notFound);
        }
    }
}

export function paginationParser<Entity>(
    fields: string,
    count: number,
    docs: Entity[],
    page: number,
    limit: number
): PaginationModel<Entity> {
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
