import { IUserModel, UserFormatter, UserRepository } from '../../models/mongo/user-repository';
import { BaseService } from '../../models/shared/base-service';
import { DefaultResponse, Failed, scopes } from '../../models/types';
import { BatchRepository, batchStringToModel, isBatchString } from '../../models/mongo/batch-repository';
import { checkString, getArgonHash } from '../../util/general-util';
import { MailService } from '../../shared/mail-service';
import * as fs from 'fs';
import * as path from 'path';
import cryptoRandomString from 'crypto-random-string';
import { Logger } from '../../shared/logger';
import constants from '../../constants';
import { CreateUserCSV, ResetPasswordRequest, UpdateUser } from './controller';
import {
    IPasswordResetModel,
    PasswordResetFormatter,
    PasswordResetRepository
} from '../../models/mongo/password-reset-repository';
import { UnknownApiError } from '../../shared/error-handler';
import { PaginationModel } from '../../models/shared/pagination-model';
import { ITrackModel, TrackRepository } from '../../models/mongo/track-repository';
import { provideSingleton } from '../../provide-singleton';
import { inject } from 'inversify';

const scopeArray: string[] = ['teacher', 'admin', 'student'];

@provideSingleton(UsersService)
export class UsersService extends BaseService<IUserModel> {
    private createUserTemplate;

    private resetPasswordTemplate;

    @inject(UserRepository) protected repository: UserRepository;
    @inject(BatchRepository) protected batchRepo: BatchRepository;
    @inject(PasswordResetRepository) protected passReset: PasswordResetRepository;
    @inject(MailService) protected mailer: MailService;
    @inject(TrackRepository) protected trackRepository: TrackRepository;
    constructor() {
        super();
        if (constants.environment !== 'test') {
            this.createUserTemplate = fs
                .readFileSync(path.join(__dirname, constants.emailTemplates.userCreation))
                .toString();
            this.resetPasswordTemplate = fs
                .readFileSync(path.join(__dirname, constants.emailTemplates.passReset))
                .toString();
        } else {
            this.createUserTemplate = '';
            this.resetPasswordTemplate = '';
        }
    }

    public async basic(userId: string, role: scopes): Promise<IUserModel> {
        return this.repository.getPopulated(userId, role);
    }

    public createUsers(obj: any[], options: CreateUserCSV): Promise<Failed[]> {
        return new Promise<Failed[]>(async (resolve, reject) => {
            try {
                const failed: Failed[] = [];
                const mailList = [];
                for (const v of obj) {
                    if (!checkString(v, 'role', scopeArray)) {
                        failed.push({
                            item: v,
                            reason: 'role: invalid'
                        });
                        continue;
                    }
                    if (!checkString(v, 'rollNo')) {
                        failed.push({
                            item: v,
                            reason: 'rollNo: invalid'
                        });
                        continue;
                    }
                    if (!checkString(v, 'name')) {
                        failed.push({
                            item: v,
                            reason: 'name: invalid'
                        });
                        continue;
                    }
                    if (v['role'] === 'student' && !isBatchString(v['batch'])) {
                        failed.push({
                            item: v,
                            reason: 'batch: invalid'
                        });
                        continue;
                    }
                    if (!options.defaultRollNoAsEmail && !checkString(v, 'username')) {
                        failed.push({
                            item: v,
                            reason: 'not_found: username'
                        });
                        continue;
                    }
                    try {
                        const user = {
                            name: v['name'],
                            username: UsersService.getEmail(v as IUserModel, options.defaultRollNoAsEmail),
                            password: cryptoRandomString({ length: 8, type: 'url-safe' }),
                            rollNo: v['rollNo'].toLowerCase(),
                            role: v['role'],
                            batch: v['batch']
                        };
                        await this.createHelper(user);
                        mailList.push(user);
                    } catch (err) {
                        failed.push({
                            item: v,
                            reason: 'unknown',
                            error: err
                        });
                    }
                }
                try {
                    await this.sendCreateEmails(mailList);
                } catch (err) {
                    // eslint-disable-next-line no-empty
                }
                resolve(failed);
            } catch (err) {
                reject(err);
            }
        });
    }

    public async updatePass(id: string, password: string): Promise<void> {
        // @ts-ignore
        await this.repository.update(id, { password: await getArgonHash(password) });
    }

    public requestReset(userId: string): Promise<DefaultResponse> {
        return new Promise<DefaultResponse>(async (resolve, reject) => {
            try {
                const user = await this.repository.findOne({ username: userId });
                if (user) {
                    try {
                        try {
                            const preExisting = await this.passReset.findOne({
                                user: user.id
                            });
                            if (preExisting && preExisting.id != null) {
                                await this.passReset.delete(preExisting.id);
                            }
                            // eslint-disable-next-line no-empty
                        } catch (err) {}
                        const code = cryptoRandomString({ length: 64, type: 'url-safe' });
                        await this.passReset.create(
                            new PasswordResetFormatter({
                                code,
                                user: user.id
                            })
                        );
                        const expireAt = new Date();
                        expireAt.setHours(expireAt.getHours() + 2);
                        this.mailer
                            .replaceAndSendEmail(
                                [`${user.name} <${user.username}>`],
                                [
                                    {
                                        username: user.username,
                                        expireAt: expireAt.toLocaleString(),
                                        url: `${constants.baseUrl}/resetPassword?code=${code}`
                                    }
                                ],
                                'Reset password - Amrita EMS',
                                this.resetPasswordTemplate
                            )
                            .then((res) => Logger.log(res))
                            .catch((err) => Logger.error(err));
                        resolve({ status: true, message: 'Reset initiated!' });
                    } catch (err) {
                        reject(UnknownApiError(err));
                    }
                } else {
                    resolve({ status: false, message: 'user_no_exist' });
                }
            } catch (err) {
                reject(UnknownApiError(err));
            }
        });
    }

    public async validReset(code: string): Promise<IPasswordResetModel> {
        return this.passReset.findOne({ code });
    }

    public resetPassword(options: ResetPasswordRequest): Promise<DefaultResponse> {
        return new Promise<DefaultResponse>(async (resolve, reject) => {
            try {
                const code = await this.passReset.findOne({ code: options.code });
                if (code && code.id != null) {
                    await this.passReset.delete(code.id.toString());
                    await this.updatePass(code.user, options.password);
                    resolve({ status: true, message: 'success' });
                } else {
                    resolve({ status: false, message: 'Reset link expired!' });
                }
            } catch (err) {
                reject(UnknownApiError(err));
            }
        });
    }

    public updateUser(options: UpdateUser[]): Promise<Failed[]> {
        return new Promise<Failed[]>(async (resolve, reject) => {
            try {
                const failed: Failed[] = [];
                for (const v of options) {
                    try {
                        if (checkString(v, 'password')) {
                            // @ts-ignore
                            v.password = await getArgonHash(v.password);
                        }
                        // @ts-ignore
                        await this.repository.findAndUpdate({ rollNo: v.rollNo }, v);
                    } catch (err) {
                        if (err?.status === 404) {
                            failed.push({
                                item: v,
                                reason: 'not_found',
                                error: err
                            });
                        } else {
                            failed.push({
                                item: v,
                                reason: 'unknown',
                                error: err
                            });
                        }
                    }
                }
                resolve(failed);
            } catch (err) {
                reject(err);
            }
        });
    }

    public async getByRollNo(rollNo: string): Promise<IUserModel> {
        // @ts-ignore
        return this.repository.getPopulated((await this.repository.findOne({ rollNo })).id, 'any');
    }

    public deleteUsers(users: string[]): Promise<Failed[]> {
        return new Promise<Failed[]>(async (resolve, reject) => {
            const failed: Failed[] = [];
            try {
                for (const v of users) {
                    try {
                        await this.repository.delete(v);
                    } catch (err) {
                        if (err?.statusCode == 404) {
                            failed.push({
                                item: v,
                                reason: 'not_found',
                                error: err
                            });
                        } else {
                            failed.push({
                                item: v,
                                reason: 'unknown',
                                error: err
                            });
                        }
                    }
                }
            } catch (err) {
                return reject(err);
            }
            return resolve(failed);
        });
    }

    private async createHelper(userCreationParams: IUserModel): Promise<IUserModel> {
        let id = undefined;
        if (userCreationParams.batch) {
            // @ts-ignore
            const batch = batchStringToModel(userCreationParams.batch);
            try {
                await this.batchRepo.create({
                    year: batch.year,
                    numYears: batch.numYears,
                    degree: batch.degree,
                    course: batch.course,
                    batchString: batch.batchString
                });
                // eslint-disable-next-line no-empty
            } catch (err) {}
            // @ts-ignore
            id = (await this.batchRepo.findOne({ batchString: batch.batchString })).id.toString();
        }
        const newUser = new UserFormatter({
            name: userCreationParams.name,
            username: userCreationParams.username,
            password: await getArgonHash(userCreationParams.password),
            role: userCreationParams.role,
            rollNo: userCreationParams.rollNo,
            batch: id
        });
        return this.repository.create(newUser);
    }

    private async sendCreateEmails(users: IUserModel[]) {
        return this.mailer.replaceAndSendEmail(
            users.map((e) => `${e.name} <${e.username}>`),
            users.map((e) => ({ name: e.name, password: e.password })),
            'Welcome {{name}} to Amrita EMS!',
            this.createUserTemplate
        );
    }

    private static getEmail(obj: IUserModel, rollNoAsEmail: boolean): string {
        if (rollNoAsEmail) {
            if (checkString(obj, 'username')) {
                return obj['username'];
            } else {
                return (
                    obj['rollNo'].toLowerCase() +
                    '@' +
                    (obj['role'] === 'student' ? constants.emailSuffix.student : constants.emailSuffix.teacher)
                );
            }
        }
        return obj['username'];
    }

    public async getTrackedDataPaginated(
        page: number,
        limit: number,
        fields: string,
        sort: string,
        query: any
    ): Promise<PaginationModel<ITrackModel>> {
        const skip: number = (Math.max(1, page) - 1) * limit;
        // eslint-disable-next-line prefer-const
        let [count, docs] = await Promise.all([
            this.trackRepository.count(query),
            this.trackRepository.findAndPopulate(skip, limit, sort, query)
        ]);
        const fieldArray = (fields || '')
        .split(',')
        .map((field) => field.trim())
        .filter(Boolean);
        if (fieldArray.length)
            docs = docs.map((d: { [x: string]: any }) => {
                const attrs: any = {};
                // @ts-ignore
                fieldArray.forEach((f) => (attrs[f] = d[f]));
                return attrs;
            });
        return new PaginationModel<ITrackModel>({
            count,
            page,
            limit,
            docs,
            totalPages: Math.ceil(count / limit)
        });
    }
}
