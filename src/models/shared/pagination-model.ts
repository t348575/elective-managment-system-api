export interface IPaginationModel {
    count: number;
    page: number;
    limit: number;
    totalPages: number;
    docs: any[];
}

export class PaginationModel<Entity> implements IPaginationModel {
    count: number;
    page: number;
    limit: number;
    totalPages: number;
    docs: Entity[];

    constructor(args: IPaginationModel) {
        Object.assign(this, args);
    }
}
