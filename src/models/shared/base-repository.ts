import { MongoConnector } from '../../shared/mongo-connector';
import mongoose, { Document, Model, Schema } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';
import { cleanQuery } from '../../util/general-util';
import { ApiError } from '../../shared/error-handler';
import constants from '../../constants';
import { IBaseRepository } from './ibase-repository';

export abstract class BaseRepository<EntityType> implements IBaseRepository<EntityType> {
    protected dbConnection: MongoConnector;
    protected schema: Schema | undefined;
    protected documentModel: Model<Document>;
    protected modelName: string;
    protected formatter: any = Object;
    private initiated = false;

    /** this needs to be called after the extended class super is executed */
    protected init(): void {
        if (this.initiated) {
            return;
        }
        this.documentModel = this.dbConnection.db.model(this.modelName, this.schema);
        // @ts-ignore
        this.schema.plugin(uniqueValidator);
        this.initiated = true;
        // @ts-ignore
        this.schema.set('toJSON', {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            transform: (doc: any, ret: { id: any; _id: any; __v: any }, options: any) => {
                ret.id = ret._id;
                delete ret._id;
                delete ret.__v;
            }
        });
    }

    public async create(model: EntityType): Promise<EntityType> {
        const document: Document = await this.documentModel.create(this.cleanToSave(model));
        return new this.formatter(document);
    }

    async getById(id: string) {
        // @ts-ignore
        const document: Document = await this.documentModel.findOne({
            _id: mongoose.Types.ObjectId(id)
        });
        if (!document) throw new ApiError(constants.errorTypes.notFound);
        return new this.formatter(document);
    }

    public async update(_id: string, model: EntityType): Promise<void> {
        await this.documentModel.updateOne({ _id }, this.cleanToSave(model));
    }

    public async delete(_id: string): Promise<{ n: number }> {
        // @ts-ignore
        return this.documentModel.deleteOne({ _id });
    }

    public async find(sort: string, query: any, limit = 250, skip = 0): Promise<EntityType[]> {
        const sortObject = cleanQuery(sort, this.sortQueryFormatter);
        return (
            await this.documentModel
                .find(this.cleanWhereQuery(query))
                .sort(Object.keys(sortObject).map((key) => [key, sortObject[key]]))
                .skip(skip)
                .limit(limit)
        ).map((item) => new this.formatter(item));
    }

    public async findAndUpdate(query: any, model: EntityType): Promise<EntityType> {
        // @ts-ignore
        const document: Document = await this.documentModel.findOneAndUpdate(
            this.cleanWhereQuery(query),
            this.cleanToSave(model)
        );
        if (!document) throw new ApiError(constants.errorTypes.notFound);
        return new this.formatter(document);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async findOne<T>(query: any): Promise<EntityType> {
        // @ts-ignore
        const document: Document = await this.documentModel.findOne(query);
        if (!document) throw new ApiError(constants.errorTypes.notFound);
        return new this.formatter(document);
    }

    public async count(query: any): Promise<number> {
        return this.documentModel.count(this.cleanWhereQuery(query));
    }

    protected cleanToSave(entity: EntityType): EntityType {
        const copy: EntityType = new this.formatter(entity);
        const loop = (value: any): any => {
            if (!value || typeof value !== 'object') {
                return;
            }
            /** formatting logic to save goes here */
            Object.keys(value).forEach((key) => loop(value[key]));
        };
        loop(copy);
        return copy;
    }

    protected sortQueryFormatter(key: string, value: string): number | undefined {
        if (value === 'asc') return 1;
        if (value === 'desc') return -1;
        return undefined;
    }

    protected cleanWhereQuery(query: any): { [key: string]: any } {
        if (!query || typeof query === 'string') return cleanQuery(query);

        const newQuery = { $or: [] };
        Object.keys(query).forEach((key) => {
            const value = query[key];
            if (!(value instanceof Array)) {
                // @ts-ignore
                newQuery[key] = value;
            } else {
                newQuery.$or = newQuery.$or.concat(
                    // @ts-ignore
                    value.map((item) => ({ [key]: item }))
                );
            }
        });
        if (!newQuery.$or.length) {
            // @ts-ignore
            delete newQuery.$or;
        }
        return newQuery;
    }
}
