import {ProvideSingleton} from '../../shared/provide-singleton';
import {inject, injectable} from 'inversify';
import {IUserModel, UserFormatter, UserRepository} from '../../models/mongo/user-repository';
import {BaseService} from '../../models/shared/base-service';
import mongoose from 'mongoose';
import {scopes} from '../../models/types';
import {BatchFormatter, BatchRepository, batchStringToModel, isBatchString} from '../../models/mongo/batch-repository';
import {checkString, getArgonHash} from '../../util/general-util';
import {MailService} from '../../shared/mail-service';
import * as fs from 'fs';
import * as path from 'path';
import cryptoRandomString from 'crypto-random-string';
import {Logger} from '../../shared/logger';
import constants from '../../constants';
import {CreateUser, CreateUserCSV} from './controller';

const scopeArray: string[] = ['teacher', 'admin', 'student'];

const adminOnly: string[] = ['admin'];

const teacherOrStudent: string[] = ['student', 'teacher'];

@ProvideSingleton(UsersService)
export class UsersService extends BaseService<IUserModel> {

	private createUserTemplate = fs.readFileSync(path.join(__dirname, '/../../../resources/assets/user-creation.html')).toString();

	constructor(
		@inject(UserRepository) protected repository: UserRepository,
		@inject(BatchRepository) protected batchRepo: BatchRepository,
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
		return this.mailer.replaceAndSendEmail(users.map(e => `${e.name} <${e.username}>`), users.map(e => ({ name: e.name, password: e.password })), 'Welcome {{name}} to Amrita - EMS!', this.createUserTemplate);
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
}
