import { INotificationModel, NotificationRepository } from '../../models/mongo/notification-repository';
import { BaseService } from '../../models/shared/base-service';
import { Singleton, Inject } from 'typescript-ioc';
import { CustomNotifyOptions, SubscribeOptions, UnSubscribeOptions } from './controller';
import constants from '../../constants';
import * as webPush from 'web-push';
import { ApiError } from '../../shared/error-handler';
import { BatchRepository } from '../../models/mongo/batch-repository';
import { UserRepository } from '../../models/mongo/user-repository';

@Singleton
export class NotificationService extends BaseService<INotificationModel> {
    @Inject protected repository: NotificationRepository;
    @Inject private batchRepository: BatchRepository;
    @Inject private userRepository: UserRepository;
    constructor() {
        super();
        webPush.setVapidDetails(
            `mailto:${constants.mailAccess.username}`,
            constants.vapidKeys.publicKey,
            constants.vapidKeys.privateKey
        );
    }

    public async subscribe(options: SubscribeOptions, userId: string) {
        try {
            const previous = await this.repository.findOne({
                user: userId,
                device: options.name
            });
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

    public async unsubscribe(options: UnSubscribeOptions, userId: string) {
        try {
            const previous = await this.repository.findOne({
                user: userId,
                device: options.name
            });
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
                        await webPush.sendNotification(v.sub, JSON.stringify(notificationPayload));
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
                        await webPush.sendNotification(v.sub, JSON.stringify(notificationPayload));
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

    public async notifyAll(notificationPayload: { notification: any }) {
        const ids = await this.repository.find('', '', undefined, 0);
        for (const v of ids) {
            try {
                await webPush.sendNotification(v.sub, JSON.stringify(notificationPayload));
            } catch (err) {
                try {
                    // @ts-ignore
                    await this.repository.delete(v.id);
                    // eslint-disable-next-line no-empty
                } catch (err) {}
            }
        }
    }

    public async isSubscribed(device: string, user: string): Promise<{ subscribed: boolean }> {
        try {
            await this.repository.findOne({ user, device });
            return { subscribed: true };
        } catch (err) {
            return { subscribed: false };
        }
    }

    public async customNotify(options: CustomNotifyOptions): Promise<boolean> {
        try {
            let batchIds: string[] = [];
            let query = {};
            if (options.batches.length > 0) {
                // @ts-ignore
                batchIds = [
                    ...(await this.batchRepository.find('', { batchString: { $in: options.batches } })).map((e) => e.id)
                ];
            }
            if (batchIds.length > 0) {
                // @ts-ignore
                query.batch = {
                    $in: batchIds
                };
            }
            if (options.users.length > 0) {
                // @ts-ignore
                query.rollNo = {
                    $in: options.users
                };
            }
            if (options.role) {
                query = {
                    role: options.role
                };
            }
            if (options.notifyAll) {
                query = {};
            }
            const users = await this.userRepository.find('', query, undefined, 0);
            const items = ['name', 'rollNo', 'username'];
            if (options.replaceItems) {
                for (const v of users) {
                    let title = options.title;
                    let body = options.body;
                    for (const k in items) {
                        // @ts-ignore
                        title = title.replace(new RegExp(`{{${items[k]}}}`, 'gmi'), v[items[k]]);
                        // @ts-ignore
                        body = body.replace(new RegExp(`{{${items[k]}}}`, 'gmi'), v[items[k]]);
                    }
                    // @ts-ignore
                    await this.notifyUsers([v.id], {
                        notification: {
                            title,
                            body,
                            vibrate: [100, 50, 100],
                            requireInteraction: true
                        }
                    });
                }
            } else {
                await this.notifyUsers(
                    // @ts-ignore
                    users.map((e) => e.id),
                    {
                        notification: {
                            title: options.title,
                            body: options.body,
                            vibrate: [100, 50, 100],
                            requireInteraction: true
                        }
                    }
                );
            }
            return true;
        } catch (err) {
            return false;
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
