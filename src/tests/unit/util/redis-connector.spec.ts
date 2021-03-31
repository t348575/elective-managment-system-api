import 'reflect-metadata';
import {expect} from 'chai';
import {init} from '../../unit-helper';
import {RedisConnector} from '../../../shared/redis-connector';

init();

describe('Redis connector', () => {
    it('Should connect', async () => {
        const connector = new RedisConnector();
        expect(await new Promise((resolve, reject) => {
            connector.db.on('ready', () => {
                resolve(true);
            });
            setTimeout(() => {
                resolve(false);
            }, 1000);
        }) && connector.db.connected).to.be.true;
        connector.db.quit();
    });

    describe('Set key', () => {
        it('Set key with expiry', async () => {
            const connector = new RedisConnector();
            expect(await connector.setex('test', 2, 'asd')).to.be.true;
            expect(await connector.exists('test')).to.be.true;
            expect(await new Promise(resolve => {
                setTimeout(async () => {
                    resolve(await connector.exists('test'));
                }, 2500);
            })).to.be.false;
            connector.db.quit();
        });
    });

    describe('Remove key', () => {
        it('Should remove key', async () => {
            const connector = new RedisConnector();
            expect(await connector.setex('test1', 5, 'asd')).to.be.true;
            expect(await connector.exists('test1')).to.be.true;
            expect(await connector.remove('test1')).to.be.true;
            expect(await connector.exists('test1')).to.be.false;
            connector.db.quit();
        });
    });

});
