import { UnitHelper } from '../../unit-helper';
const unitHelper = new UnitHelper();
import proxyquire from 'proxyquire';
import { setupMockUsers } from '../../models/user.model';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { IUserModel } from '../../../models/mongo/user-repository';
import { Container } from 'typescript-ioc';
import {
    generateRandomSub,
    MockWebPush,
    mockWebPushSendNotification,
    mockWebPushSetVapidDetails
} from '../../mocks/mock-web-push';
const proxyNotifications = proxyquire('../../../routes/notification/service', {
    'web-push': MockWebPush
});
import { NotificationService as RealNotificationService } from '../../../routes/notification/service';
import constants from '../../../constants';
import { BatchRepository } from '../../../models/mongo/batch-repository';
import { MongoConnector } from '../../../shared/mongo-connector';

chai.use(chaiAsPromised);

let users: IUserModel[] = [];

describe('Notification service', () => {
    before(async () => {
        await unitHelper.init();
        users = await setupMockUsers();
    });

    afterEach(() => {
        mockWebPushSetVapidDetails.resetHistory();
        mockWebPushSendNotification.resetHistory();
    });
    const NotificationService = proxyNotifications.NotificationService;

    const notification = {
        title: 'Welcome to Amrita EMS!',
        body: 'Thank you for enabling notifications',
        vibrate: [100, 50, 100],
        actions: [
            {
                action: 'home',
                title: 'Go to site'
            }
        ]
    };

    it('Should create service and set vapid details', () => {
        Container.get(NotificationService);
        expect(mockWebPushSetVapidDetails.callCount).to.equal(1);
        expect(
            mockWebPushSetVapidDetails.calledOnceWithExactly(
                `mailto:${constants.mailAccess.username}`,
                constants.vapidKeys.publicKey,
                constants.vapidKeys.privateKey
            )
        );
    });

    it('Should subscribe to notifications', async () => {
        await (Container.get(NotificationService) as RealNotificationService).subscribe(
            {
                name: 'test_notification',
                sub: generateRandomSub()
            },
            users[0].id as string
        );
        expect(mockWebPushSendNotification.callCount).to.equal(1);
        expect(
            await (Container.get(NotificationService) as RealNotificationService).subscribe(
                {
                    name: 'test_notification',
                    sub: generateRandomSub()
                },
                users[0].id as string
            )
        ).to.deep.equal({ status: true });
        expect(mockWebPushSendNotification.callCount).to.equal(1);
    });

    it('Should unsubscribe from notifications', async () => {
        expect(
            await (Container.get(NotificationService) as RealNotificationService).unsubscribe(
                {
                    name: 'test_notification',
                    sub: generateRandomSub()
                },
                users[0].id as string
            )
        ).to.deep.equal({ status: true });
        expect(
            (Container.get(NotificationService) as RealNotificationService).unsubscribe(
                {
                    name: 'test_notification',
                    sub: generateRandomSub()
                },
                users[0].id as string
            )
        ).to.eventually.be.rejected;
    });

    it('Should notify users', async () => {
        for (let i = 0; i < 5; i++) {
            await (Container.get(NotificationService) as RealNotificationService).subscribe(
                {
                    name: `test_notification${i}`,
                    sub: generateRandomSub()
                },
                users[0].id as string
            );
        }
        await (Container.get(NotificationService) as RealNotificationService).notifyUsers(
            users.slice(0, 5).map((e) => e.id as string),
            { notification }
        );
        expect(mockWebPushSendNotification.callCount).to.equal(10);
    });

    it('Should notify batches', async () => {
        const batches = [...new Set(users.slice(0, 5).map((e) => (e.batch as unknown) as string))];
        const expectCount = [...users.slice(0, 5).map((e) => (e.batch as unknown) as string)].length;
        await (Container.get(NotificationService) as RealNotificationService).notifyBatches(batches, { notification });
        expect(mockWebPushSendNotification.callCount).to.equal(expectCount);
    });

    it('Should notify all users', async () => {
        await (Container.get(NotificationService) as RealNotificationService).notifyAll({ notification });
        expect(mockWebPushSendNotification.callCount).to.equal(5);
    });

    it('Should check user is subscribed', async () => {
        expect(
            await (Container.get(NotificationService) as RealNotificationService).isSubscribed(
                'test_notification0',
                users[0].id as string
            )
        ).to.deep.equal({ subscribed: true });
        expect(
            await (Container.get(NotificationService) as RealNotificationService).isSubscribed(
                'test_notification6',
                users[0].id as string
            )
        ).to.deep.equal({ subscribed: false });
    });

    it('Should send a custom notification', async () => {
        const batches = [...new Set(users.slice(0, 5).map((e) => (e.batch as unknown) as string))];
        for (const [i, v] of users.entries()) {
            await (Container.get(MongoConnector).db.dropCollection('notifications'));
            await (Container.get(NotificationService) as RealNotificationService).subscribe(
                {
                    name: `test_notification${i}${v.id as string}`,
                    sub: generateRandomSub()
                },
                v.id as string
            );
        }
        await (Container.get(NotificationService) as RealNotificationService).customNotify({
            batches: (await Container.get(BatchRepository).find('', { _id: { $in: batches } })).map(
                (e) => e.batchString
            ),
            users: [],
            notifyAll: false,
            title: 'test',
            body: 'asd',
            replaceItems: false
        });
        await (Container.get(NotificationService) as RealNotificationService).customNotify({
            batches: [],
            users: users.slice(0, 5).map((e) => e.id as string),
            notifyAll: false,
            title: 'test',
            body: 'asd',
            replaceItems: true
        });
        expect(mockWebPushSendNotification.callCount).to.be.within(57,58);
        await (Container.get(NotificationService) as RealNotificationService).customNotify({
            batches: [],
            users: [],
            notifyAll: true,
            title: 'test',
            body: 'asd',
            replaceItems: true
        });
        expect(mockWebPushSendNotification.callCount).to.be.within(57,58);
        await (Container.get(NotificationService) as RealNotificationService).customNotify({
            batches: [],
            users: [],
            notifyAll: false,
            role: 'student',
            title: 'test',
            body: 'asd',
            replaceItems: true
        });
        expect(mockWebPushSendNotification.callCount).to.be.within(57,58);
    });
});
