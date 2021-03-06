import * as nodemailer from 'nodemailer';
import {ProvideSingleton} from './provide-singleton';
import constants from '../constants';
import Mail, {Attachment} from 'nodemailer/lib/mailer';
import {TransportOptions} from 'nodemailer';
import {SentMessageInfo} from 'nodemailer/lib/smtp-transport';

@ProvideSingleton(MailService)
export class MailService {
    private transporter: Mail;
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: constants.mailAccess.host,
            secureConnection: false,
            port: 587,
            auth: {
                user: constants.mailAccess.username,
                pass: constants.mailAccess.password
            },
            tls: {
                ciphers: 'SSLv3'
            },
            sendingRate: 2
        } as TransportOptions);
        console.log('Mail service initialized');
    }

    async sendEmail(to: string | string[], subject: string, html: string, text ?: string, attachments ?: Attachment[]) {
        if (to instanceof Array) {
            to = to.join(', ');
        }
        return this.transporter.sendMail({
            from: `"${constants.mailAccess.name}" <${constants.mailAccess.username}>`,
            to: to,
            subject,
            text: text,
            html: html,
            attachments: attachments
        });
    }

    replaceAndSendEmail(to: string[], replaceFrom: any[], subject: string, html: string, text ?: string, attachments ?: Attachment[]): Promise<SentMessageInfo[]> {
        return new Promise<SentMessageInfo[]>(async (resolve, reject) => {
            if (to.length !== replaceFrom.length || to.length === 0) {
                return reject(new Error('Length of replace and to array do not match'));
            }
            else {
                const returnItems: SentMessageInfo[] = [];
                const replaceRegex: RegExp[] = [];
                const keys = Object.keys(replaceFrom[0])
                for (const v of keys) {
                    replaceRegex.push(new RegExp(`{{${v}}}`, 'gi'));
                }
                for (const [i, v] of replaceFrom.entries()) {
                    try {
                        let replaceHTML = html;
                        let replaceSubject = subject;
                        let replaceText = text;
                        for (const [j, k] of keys.entries()) {
                            replaceHTML = replaceHTML.replace(replaceRegex[j], v[k]);
                            replaceSubject = replaceSubject.replace(replaceRegex[j], v[k]);
                            if (replaceText) {
                                replaceText = replaceText.replace(replaceRegex[j], v[k]);
                            }
                        }
                        returnItems.push(await this.transporter.sendMail({
                            from: `"${constants.mailAccess.name}" <${constants.mailAccess.username}>`,
                            to: to[i],
                            subject: replaceSubject,
                            text: replaceText,
                            html: replaceHTML,
                            attachments: attachments
                        }));
                    } catch (err) {
                        returnItems.push(err);
                    }
                }
                resolve(returnItems);
            }
        });
    }
}