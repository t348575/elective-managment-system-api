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
        webPush.setVapidDetails(constants.mailAccess.username, constants.vapidKeys.publicKey, constants.vapidKeys.privateKey);
    }

    public async subscribe(options: SubscribeOptions, userId: string) {
        const previous = await this.repository.findOne({ user: userId, endpoint: options.endpoint });
        if (previous) {
            return {
                status: true
            }
        }
        else {
            await NotificationService.initialNotification(options);
            return this.repository.create({
                // @ts-ignore
                user: userId,
                // @ts-ignore
                sub: options
            });
        }
    }

    public async unsubscribe(options: SubscribeOptions, userId: string) {
        const previous = await this.repository.findOne({ user: userId, endpoint: options.endpoint });
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

    private static async initialNotification(sub: SubscribeOptions) {
        const notificationPayload = {
            notification: {
                title: 'Welcome to Amrita EMS!',
                body: 'Thank you for enabling notifications',
                actions: [{
                    action: 'explore',
                    title: 'Go to site'
                }]
            }
        };
        return webPush.sendNotification(sub, JSON.stringify(notificationPayload));
    }
}
