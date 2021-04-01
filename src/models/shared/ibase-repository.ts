export interface IBaseRepository<EntityType> {
    create(model: EntityType): Promise<EntityType>;
    update(_id: string, model: EntityType): Promise<void>;
    delete(_id: string): Promise<{ n: number }>;

    find(sort: string, query: any, limit: number = 250, skip: number = 0): Promise<EntityType[]>;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    findOne<T>(query: any): Promise<EntityType>;
    count(query: any): Promise<number>;
}
