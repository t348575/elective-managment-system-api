import redis from 'redis';
import { Logger } from './logger';
import constants from '../constants';
import { Singleton } from 'typescript-ioc';

@Singleton
export class RedisConnector {
    public db: redis.RedisClient;
    constructor() {
        Logger.log(`connecting to ${constants.environment} Redis`);
        if (constants.redisPassword.length > 0) {
            this.db = redis.createClient({
                auth_pass: constants.redisPassword,
                host: '127.0.0.1'
            });
        }
        else {
            this.db = redis.createClient({ host: '127.0.0.1' });
        }
    }
    setex(key: string, time: number, value: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            this.db.setex(key, time, value, (err, reply) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(reply === 'OK');
                }
            });
        });
    }
    remove(key: string) {
        return this.db.del(key);
    }
    exists(key: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            this.db.exists(key, (err, reply) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(!!reply);
                }
            });
        });
    }
}
