import {ProvideSingleton} from '../../shared/provide-singleton';
import {inject, injectable} from 'inversify';
import {IUserModel, UserFormatter, UserRepository} from '../../models/mongo/user-repository';
import {BaseService} from '../../models/shared/base-service';
import mongoose from 'mongoose';
import {DefaultResponse, scopes} from '../../models/types';
import {BatchFormatter, BatchRepository, batchStringToModel, isBatchString} from '../../models/mongo/batch-repository';
import {checkString, getArgonHash} from '../../util/general-util';
import {MailService} from '../../shared/mail-service';
import * as fs from 'fs';
import * as path from 'path';
import cryptoRandomString from 'crypto-random-string';
import {Logger} from '../../shared/logger';
import constants from '../../constants';
import {CreateUser, CreateUserCSV, ResetPasswordRequest} from './controller';
import {PasswordResetFormatter, PasswordResetRepository} from '../../models/mongo/password-reset-repository';
import {ApiError, UnknownApiError} from '../../shared/error-handler';

const scopeArray: string[] = ['teacher', 'admin', 'student'];

const adminOnly: string[] = ['admin'];

const teacherOrStudent: string[] = ['student', 'teacher'];

@ProvideSingleton(UsersService)
export class UsersService extends BaseService<IUserModel> {

	private createUserTemplate = fs.readFileSync(path.join(__dirname, constants.emailTemplates.userCreation)).toString();

	private resetPasswordTemplate = fs.readFileSync(path.join(__dirname, constants.emailTemplates.passReset)).toString();

	constructor(
		@inject(UserRepository) protected repository: UserRepository,
		@inject(BatchRepository) protected batchRepo: BatchRepository,
		@inject(PasswordResetRepository) protected passReset: PasswordResetRepository,
		@inject(MailService) protected mailer: MailService
	) {
		super();
	}

	public async basic(userId: string, role: scopes) {
		return this.repository.getPopulated(userId, role);
	}

	public createUsers(obj: any[], options: CreateUserCSV): Promise<any[]> {
		return new Promise<any[]>(async (resolve, reject) => {
			try {
				const invalid: any[] = [];
				const mailList = [];
				for (const v of obj) {
					if (checkString(v, 'role', teacherOrStudent) &&
						checkString(v, 'rollNo') &&
						checkString(v, 'name') &&
						(
							v['role'] === 'teacher' ||
							v['role'] === 'admin' ||
							(
								v['role'] === 'student' &&
								isBatchString(v['batch'])
							)
						) &&
						(

							options.defaultRollNoAsEmail ||
							(
								!options.defaultRollNoAsEmail &&
								checkString(v, 'username')
							)
						)) {
						try {
							const user = {
								name: v['name'],
								username: UsersService.getEmail(v as IUserModel, options.defaultRollNoAsEmail),
								password: cryptoRandomString({ length: 8, type: 'url-safe' }),
								rollNo: v['rollNo'],
								role: v['role'],
								batch: v['batch']
							};
							await this.createHelper(user);
							mailList.push(user);
						}
						catch (err) {
							invalid.push(v);
						}
					}
					else {
						invalid.push(v);
					}
				}
				this.sendCreateEmails(mailList).then().catch(err => Logger.error(err));
				resolve(invalid);
			} catch (err) {
				reject(err);
			}
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
			}
			catch (err) {}
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
		return this.mailer.replaceAndSendEmail(users.map(e => `${e.name} <${e.username}>`), users.map(e => ({ name: e.name, password: e.password })), 'Welcome {{name}} to Amrita EMS!', this.createUserTemplate);
	}

	private static getEmail(obj: IUserModel, rollNoAsEmail: boolean): string {
		if (rollNoAsEmail) {
			if (checkString(obj, 'username')) {
				return obj['username'];
			}
			else {
				return obj['rollNo'] + '@' + (obj['role'] === 'student' ? constants.emailSuffix.student : constants.emailSuffix.teacher);
			}
		}
		return obj['username'];
	}

	public async updatePass(id: string, password: string) {
		// @ts-ignore
		return this.repository.update(id, { password });
	}

	public requestReset(userId: string): Promise<DefaultResponse> {
		return new Promise<DefaultResponse>(async (resolve, reject) => {
			try {
				const user = await this.repository.findOne({ username: userId });
				if (user) {
					try {
						try {
							const preExisting = await this.passReset.findOne({ user: user.id });
							if (preExisting && preExisting.id != null) {
								await this.passReset.delete(preExisting.id);
							}
						} catch (err) {}
						const code = cryptoRandomString({ length: 64, type: 'url-safe' });
						await this.passReset.create(new PasswordResetFormatter({
							code,
							user: user.id
						}));
						const expireAt = new Date();
						expireAt.setHours(expireAt.getHours() + 2);
						this.mailer.replaceAndSendEmail([`${user.name} <${user.username}>`],
						[{
							username: user.username,
							expireAt: expireAt.toLocaleString(),
							url: `${constants.baseUrl}/resetPassword?code=${code}`
						}], 'Reset password - Amrita EMS', this.resetPasswordTemplate).then(res => Logger.log(res)).catch(err => Logger.error(err));
						resolve({ status: true, message: 'Reset initiated!' });
					}
					catch (err) {
						reject(UnknownApiError(err));
					}
				}
				else {
					resolve({ status: false, message: 'user_no_exist' });
				}
			}
			catch(err) {
				reject(UnknownApiError(err));
			}
		});
	}

	public async validReset(code: string) {
		return this.passReset.findOne({ code });
	}

	public resetPassword(options: ResetPasswordRequest): Promise<DefaultResponse> {
		return new Promise<DefaultResponse>(async (resolve, reject) => {
			try {
				const code = await this.passReset.findOne({ code: options.code });
				if (code && code.id != null) {
					await this.passReset.delete(code.id.toString());
					const newPass = await getArgonHash(options.password);
					await this.updatePass(code.user, newPass);
					resolve({ status: true, message: 'success' });
				}
				else {
					resolve({ status: false, message: 'Reset link expired!'});
				}
			}
			catch(err) {
				reject(UnknownApiError(err));
			}
		});
	}
}
