import 'reflect-metadata';
import { expect } from 'chai';
import { init } from '../../unit-helper';
import { MongoConnector } from '../../../shared/mongo-connector';

init();

describe('MongoDB connector', () => {
    it('Should connect', async () => {
        const connector = new MongoConnector();
        expect(
            await new Promise((resolve) => {
                setTimeout(() => {
                    resolve(connector.db.readyState);
                }, 1000);
            })
        ).to.be.equal(1);
        await connector.db.close();
    });
});
