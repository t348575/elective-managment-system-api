import { ImmutabilityHelper } from './immutability-helper';
import mongoose from 'mongoose';

export abstract class BaseFormatter {
    public id: string;
    public _id: string;

    protected format(args: any = {}): void {
        if (typeof args.toJSON === 'function') args = args.toJSON();
        Object.keys(args).forEach((key: string) => {
            if (args[key] !== undefined) {
                if (args[key] instanceof mongoose.Types.ObjectId) {
                    // @ts-ignore
                    this[key] = args[key].toString();
                } else {
                    // @ts-ignore
                    this[key] = ImmutabilityHelper.copy(args[key]);
                    if (args[key] instanceof Date) {
                        // @ts-ignore
                        this[key] = args[key];
                    }
                }
            }
        });
    }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function remove<Entity, SafeEntity>(args: any, omit: string[]): SafeEntity {
    for (const v of Object.keys(args)) {
        if (omit.indexOf(v) > -1) {
            delete args[v];
        }
    }
    return args as SafeEntity;
}
