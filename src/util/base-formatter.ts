import {ImmutabilityHelper} from './immutability-helper';

export abstract class BaseFormatter {
	public id: string;
	public _id: string;

	protected format(args: any = {}): void {
		if (typeof args.toJSON === 'function') args = args.toJSON();
		Object.keys(args).forEach((key: string) => {
			if (args[key] !== undefined) {
				// @ts-ignore
				this[key] = ImmutabilityHelper.copy(args[key]);
			}
		});
		if (args._id) {
			this.id = args._id.toString();
			// @ts-ignore
			delete this._id;
		}
	}
}

export function remove<Entity, SafeEntity>(args: any, omit: string[]): SafeEntity {
	for (const v of Object.keys(args)) {
		if (omit.indexOf(v) > -1) {
			delete args[v];
		}
	}
	return args as SafeEntity;
}
