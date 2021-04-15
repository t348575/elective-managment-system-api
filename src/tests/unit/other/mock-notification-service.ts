/* eslint-disable @typescript-eslint/no-unused-vars */
import { SubscribeOptions } from '../../../routes/notification/controller';
import mongoose from 'mongoose';
import { spy } from 'sinon';
import * as faker from 'faker';
import { NotificationFormatter } from '../../../models/mongo/notification-repository';

export class MockNotificationService {
    public async subscribe(options: SubscribeOptions, userId: string) {
        return new NotificationFormatter({
            user: mongoose.Types.ObjectId(),
            sub: {
                endpoint: faker.internet.url(),
                expirationTime: null,
                keys: {
                    p256dh: faker.random.alphaNumeric(64),
                    auth: faker.random.alphaNumeric(64)
                }
            },
            device: faker.datatype.uuid(),
            id: mongoose.Types.ObjectId()
        });
    }

    public async unsubscribe(options: SubscribeOptions, userId: string) {
        return {
            status: true
        };
    }

    public async notifyUsers(userIds: string[], notificationPayload: { notification: any }) {
        return;
    }

    public async notifyBatches(batchStrings: string[], notificationPayload: { notification: any }) {
        return;
    }

    public async notifyAll() {
        return;
    }

    public async isSubscribed(device: string, user: string): Promise<{ subscribed: boolean }> {
        return { subscribed: false };
    }

    private static async initialNotification(sub: {
        endpoint: string;
        expirationTime: number | null;
        keys: { p256dh: string; auth: string };
    }) {
        return {
            statusCode: 200,
            body: faker.random.alphaNumeric(32),
            headers: {}
        };
    }
}

export const mockNotifyBatches = spy(MockNotificationService.prototype, 'notifyBatches');
