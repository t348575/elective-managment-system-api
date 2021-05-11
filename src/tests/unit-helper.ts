import { Logger } from '../shared/logger';
import { setConstants } from '../util/general-util';
import dotenv from 'dotenv';
import path from 'path';
import { PrivateInjectorInit } from '../routes/private-injector-init';
import { Container } from 'typescript-ioc';
import { MongoConnector } from '../shared/mongo-connector';
import { MailService } from '../shared/mail-service';
import { MockMailService } from './mocks/mock-mail-service';

dotenv.config({
    path: path.resolve(process.cwd(), `${process.env.NODE_ENV}.env`)
});
export class UnitHelper {

    constructor() {
        setConstants();
        Logger.init();
    }

    async init(): Promise<void> {
        Container.get(MongoConnector);
        await new Promise<void>(resolve => setTimeout(() => resolve(), 1000));
        const collections: string[] = ['users', 'track', 'responses', 'password-reset', 'notifications', 'forms', 'electives', 'downloads', 'classes', 'batches', 'request-change', 'quiz-response', 'quizzes'];
        for (const v of collections) {
            try {
                await Container.get(MongoConnector).db.dropCollection(v);
            }
            // eslint-disable-next-line no-empty
            catch(err) {}
        }
        Container.bind(MailService).to(MockMailService);
        Container.get(PrivateInjectorInit);
    }
}
