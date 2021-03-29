import {ProvideSingleton} from '../../shared/provide-singleton';
import {INotificationModel, NotificationRepository} from '../../models/mongo/notification-repository';
import {BaseService} from '../../models/shared/base-service';
import {inject} from 'inversify';
import {SubscribeOptions} from './controller';
import constants from '../../constants';
import * as webPush from 'web-push';

@ProvideSingleton(NotificationService)
export class NotificationService extends BaseService<INotificationModel> {
    constructor(
        @inject(NotificationRepository) protected repository: NotificationRepository
    ) {
        super();
        webPush.setVapidDetails('mailto:' + constants.mailAccess.username, constants.vapidKeys.publicKey, constants.vapidKeys.privateKey);
    }

    public async subscribe(options: SubscribeOptions, userId: string) {
        try {
            const previous = await this.repository.findOne({ user: userId, device: options.name });
            if (previous) {
                return {
                    status: true
                }
            }
            else {
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
        catch(err) {
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
        const previous = await this.repository.findOne({ user: userId, endpoint: options.sub.endpoint });
        if (previous) {
            return {
                status: true
            }
        }
        else {
            return this.repository.create({
                // @ts-ignore
                user: userId,
                // @ts-ignore
                sub: options
            });
        }
    }

    public async notifyAll() {
        const ids = await this.repository.find(0, undefined, '', '');
        setTimeout(() => {
            for (const v of ids) {
                try {
                    NotificationService.initialNotification(v.sub).then().catch();
                }
                catch (err) {}
            }
        }, 10000)
    }

    private static async initialNotification(sub: { endpoint: string; expirationTime: number | null; keys: { p256dh: string; auth: string } }) {
        const notificationPayload = {
            notification: {
                title: 'Welcome to Amrita EMS!',
                body: 'Thank you for enabling notifications',
                vibrate: [100, 50, 100],
                actions: [{
                    action: 'home',
                    title: 'Go to site'
                }]
            }
        };
        return webPush.sendNotification(sub, JSON.stringify(notificationPayload));
    }
}
