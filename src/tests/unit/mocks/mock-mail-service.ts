/* eslint-disable @typescript-eslint/no-unused-vars */
import { Attachment } from 'nodemailer/lib/mailer';
import { SentMessageInfo } from 'nodemailer/lib/smtp-transport';
import * as faker from 'faker';
import { spy } from 'sinon';
export class MockMailService {
    sendEmail(
        to: string | string[],
        subject: string,
        html: string,
        text?: string,
        attachments?: Attachment[]
    ): Promise<SentMessageInfo> {
        return new Promise<SentMessageInfo>((resolve) => {
            process.nextTick(() => {
                resolve({
                    envelope: {
                        from: faker.internet.email(),
                        to
                    },
                    messageId: faker.datatype.uuid()
                } as SentMessageInfo);
            });
        });
    }
    replaceAndSendEmail(
        to: string[],
        replaceFrom: any[],
        subject: string,
        html: string,
        text?: string,
        attachments?: Attachment[]
    ): Promise<SentMessageInfo[]> {
        return new Promise<SentMessageInfo[]>((resolve) => {
            process.nextTick(() => {
                const items = [];
                for (let i = 0; i < to.length; i++) {
                    items.push({
                        envelope: {
                            from: faker.internet.email(),
                            to
                        },
                        messageId: faker.datatype.uuid()
                    } as SentMessageInfo);
                }
                resolve(items);
            });
        });
    }
}
export const mockMailReplaceSpy = spy(MockMailService.prototype, 'replaceAndSendEmail');
