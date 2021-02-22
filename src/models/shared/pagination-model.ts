export interface IPaginationModel {
	count: number;
	page: number;
	limit: number;
	totalPages: number;
	docs: any[];
}

export class PaginationModel implements IPaginationModel {
	count: number;
	page: number;
	limit: number;
	totalPages: number;
	docs: any[];

	constructor(args: IPaginationModel) {
		Object.assign(this, args);
	}
}
