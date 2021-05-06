/* eslint-disable @typescript-eslint/no-unused-vars */

import faker from 'faker';
import { spy } from 'sinon';

export const MockWebPush = {
    setVapidDetails: (subject: string, publicKey: string, privateKey: string) => {
        return;
    },
    sendNotification: (
        sub: {
            endpoint: string;
            expirationTime: number | null;
            keys: { p256dh: string; auth: string };
        },
        notificationPayload: string
    ) => {
        return new Promise((resolve) => {
            process.nextTick(() => {
                resolve(generateRandomSubReply());
            });
        });
    }
};

export function generateRandomSubReply(): { statusCode: number; body: string; headers: any } {
    return {
        statusCode: 200,
        body: faker.random.alphaNumeric(32),
        headers: {}
    };
}

export function generateRandomSub(): {
    endpoint: string;
    expirationTime: null | number;
    keys: {
        p256dh: string;
        auth: string;
    };
} {
    return {
        endpoint: faker.internet.url(),
        expirationTime: null,
        keys: {
            p256dh: faker.random.alphaNumeric(64),
            auth: faker.random.alphaNumeric(64)
        }
    };
}

export const mockWebPushSendNotification = spy(MockWebPush, 'sendNotification');
export const mockWebPushSetVapidDetails = spy(MockWebPush, 'setVapidDetails');
