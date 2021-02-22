import {ImmutabilityHelper} from './immutability-helper';

export abstract class BaseFormatter {
	public id: string | undefined;
	public _id: string | undefined;

	protected format(args: any = {}): void {
		if (typeof args.toJSON === 'function') args = args.toJSON();
		Object.keys(args).forEach((key: string) => {
			if (args[key] !== undefined) {
				// @ts-ignore
				this[key] = ImmutabilityHelper.copy(args[key]);
			}
		});
		if (args._id) {
			this.id = args._id;
			delete this._id;
		}
	}
}
