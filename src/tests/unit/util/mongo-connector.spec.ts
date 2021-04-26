import { UnitHelper } from '../../unit-helper';
const unitHelper = new UnitHelper();
import { expect } from 'chai';
import { MongoConnector } from '../../../shared/mongo-connector';
import { Container } from 'typescript-ioc';

before(async () => {
    await unitHelper.initMongoMemoryServer();
});

describe('MongoDB connector', () => {
    it('Should connect', async () => {
        const connector = Container.get(MongoConnector);
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
