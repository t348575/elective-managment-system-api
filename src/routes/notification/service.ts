import { ProvideSingleton } from '../../shared/provide-singleton';
import { INotificationModel, NotificationRepository } from '../../models/mongo/notification-repository';
import { BaseService } from '../../models/shared/base-service';
import { inject } from 'inversify';
import { SubscribeOptions } from './controller';
import constants from '../../constants';
import * as webPush from 'web-push';
import { ApiError } from '../../shared/error-handler';
import { BatchRepository } from '../../models/mongo/batch-repository';

@ProvideSingleton(NotificationService)
export class NotificationService extends BaseService<INotificationModel> {
    constructor(
        @inject(NotificationRepository) protected repository: NotificationRepository,
        @inject(BatchRepository) private batchRepository: BatchRepository
    ) {
        super();
        webPush.setVapidDetails(
            'mailto:' + constants.mailAccess.username,
            constants.vapidKeys.publicKey,
            constants.vapidKeys.privateKey
        );
    }

    public async subscribe(options: SubscribeOptions, userId: string) {
        try {
            const previous = await this.repository.findOne({ user: userId, device: options.name });
            if (previous) {
                return {
                    status: true
                };
            } else {
                await NotificationService.initialNotification(options.sub);
                return this.repository.create({
                    // @ts-ignore
                    user: userId,
                    // @ts-ignore
                    sub: options.sub,
                    device: options.name
                });
            }
        } catch (err) {
            await NotificationService.initialNotification(options.sub);
            return this.repository.create({
                // @ts-ignore
                user: userId,
                // @ts-ignore
                sub: options.sub,
                device: options.name
            });
        }
    }

    public async unsubscribe(options: SubscribeOptions, userId: string) {
        try {
            const previous = await this.repository.findOne({ user: userId, device: options.name });
            if (previous) {
                // @ts-ignore
                await this.repository.delete(previous.id);
                return {
                    status: true
                };
            }
        } catch (err) {
            throw new ApiError(constants.errorTypes.notFound);
        }
    }

    public async notifyUsers(userIds: string[], notificationPayload: { notification: any }) {
        for (const user of userIds) {
            try {
                const ids = await this.repository.find('', { user: user }, undefined, 0);
                for (const v of ids) {
                    try {
                        webPush.sendNotification(v.sub, JSON.stringify(notificationPayload)).then().catch();
                    } catch (errFor) {
                        try {
                            // @ts-ignore
                            await this.repository.delete(v.id);
                            // eslint-disable-next-line no-empty
                        } catch (errInner) {}
                    }
                }
                // eslint-disable-next-line no-empty
            } catch (errOuter) {}
        }
    }

    public async notifyBatches(batchStrings: string[], notificationPayload: { notification: any }) {
        for (const batches of batchStrings) {
            try {
                const ids = await this.repository.findAndPopulate(batches);
                for (const v of ids) {
                    try {
                        webPush.sendNotification(v.sub, JSON.stringify(notificationPayload)).then().catch();
                    } catch (errFor) {
                        try {
                            // @ts-ignore
                            await this.repository.delete(v.id);
                            // eslint-disable-next-line no-empty
                        } catch (errInner) {}
                    }
                }
                // eslint-disable-next-line no-empty
            } catch (errOuter) {}
        }
    }

    public async notifyAll() {
        const ids = await this.repository.find('', '', undefined, 0);
        for (const v of ids) {
            try {
                NotificationService.initialNotification(v.sub).then();
            } catch (err) {
                try {
                    // @ts-ignore
                    await this.repository.delete(v.id);
                    // eslint-disable-next-line no-empty
                } catch (err) {}
            }
        }
    }

    private static async initialNotification(sub: {
        endpoint: string;
        expirationTime: number | null;
        keys: { p256dh: string; auth: string };
    }) {
        const notificationPayload = {
            notification: {
                title: 'Welcome to Amrita EMS!',
                body: 'Thank you for enabling notifications',
                vibrate: [100, 50, 100],
                actions: [
                    {
                        action: 'home',
                        title: 'Go to site'
                    }
                ]
            }
        };
        return webPush.sendNotification(sub, JSON.stringify(notificationPayload));
    }
}
