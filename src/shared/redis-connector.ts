import redis from 'redis';
import {Logger} from './logger';
import constants from '../constants';
import {ProvideSingleton} from './provide-singleton'
@ProvideSingleton(RedisConnector)
export class RedisConnector {
	public db: redis.RedisClient;
	constructor() {
		Logger.log(`connecting to ${constants.environment} Redis`);
		this.db = redis.createClient({ auth_pass: constants.redisPassword });
	}
	setex(key: string, time: number, value: string): Promise<boolean> {
		return new Promise<boolean>((resolve, reject) => {
			this.db.setex(key, time, value, (err, reply) => {
				if (err) {
					reject(err);
				} else {
					resolve(reply === 'OK')
				}
			});
		});
	}
	remove(key: string) {
		this.db.del(key);
	}
	exists(key: string): Promise<boolean> {
		return new Promise<boolean>((resolve, reject) => {
			this.db.exists(key, (err, reply) => {
				if (err) {
					reject(err);
				} else {
					resolve(!!reply)
				}
			});
		});
	}
}
