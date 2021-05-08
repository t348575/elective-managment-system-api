/* eslint-disable @typescript-eslint/no-unused-vars */
import { spy } from 'sinon';
export class MockRedisConnector {
    public db = {};
    setex(key: string, time: number, value: string): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            process.nextTick(() => {
                // @ts-ignore
                this.db[key] = value;
                setTimeout(() => {
                    // @ts-ignore
                    delete this.db[key];
                }, time * 1000);
                resolve(true);
            });
        });
    }
    remove(key: string) {
        return new Promise<boolean>((resolve, reject) => {
            process.nextTick(() => {
                // eslint-disable-next-line no-prototype-builtins
                if (this.db.hasOwnProperty(key)) {
                    // @ts-ignore
                    delete this.db[key];
                    resolve(true);
                }
                else {
                    reject('NO_EXIST');
                }
            });
        });
    }
    exists(key: string): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            process.nextTick(() => {
                // eslint-disable-next-line no-prototype-builtins
                if (this.db.hasOwnProperty(key)) {
                    resolve(true);
                }
                else {
                    resolve(false);
                }
            });
        });
    }
    cleanup(): void {
        this.db = {};
    }
}

export const mockRedisSetexSpy = spy(MockRedisConnector.prototype, 'setex');
export const mockRedisRemoveSpy = spy(MockRedisConnector.prototype, 'remove');
export const mockRedisExistsSpy = spy(MockRedisConnector.prototype, 'exists');
