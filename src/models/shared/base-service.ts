import { decorate, injectable } from 'inversify';

import {ApiError} from '../../shared/error-handler';
import constants from '../../constants';
import {PaginationModel} from './pagination-model';
import {ElectiveFormatter} from '../mongo/elective-repository';

export abstract class BaseService<EntityModel> {
	// @ts-ignore
	protected repository: IBaseRepository<EntityModel>;

	public async getById(_id: string): Promise<EntityModel> {
		return this.repository.findOne({ _id });
	}

	public async getPaginated(
		page: number,
		limit: number,
		fields: string,
		sort: string,
		query: any
	): Promise<PaginationModel<EntityModel>> {
		const skip: number = (Math.max(1, page) - 1) * limit;
		let [count, docs] = await Promise.all([
			this.repository.count(query),
			this.repository.find(skip, limit, sort, query)
		]);
		const fieldArray = (fields || '').split(',').map(field => field.trim()).filter(Boolean);
		if (fieldArray.length) docs = docs.map((d: { [x: string]: any; }) => {
			const attrs: any = {};
			// @ts-ignore
			fieldArray.forEach(f => attrs[f] = d[f]);
			return attrs;
		});
		return new PaginationModel<EntityModel>({
			count,
			page,
			limit,
			docs,
			totalPages: Math.ceil(count / limit),
		});
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
		if (!res.n) throw new ApiError(constants.errorTypes.notFound);
	}
}

decorate(injectable(), BaseService);
