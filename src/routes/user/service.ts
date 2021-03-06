import {ProvideSingleton} from '../../shared/provide-singleton';
import { inject } from 'inversify';
import {IUserModel, UserFormatter, UserRepository} from '../../models/mongo/user-repository';
import {BaseService} from '../../models/shared/base-service';
import mongoose from 'mongoose';
import {scopes} from '../../models/types';
import {BatchFormatter, BatchRepository, batchStringToModel} from '../../models/mongo/batch-repository';
import {getArgonHash} from '../../util/general-util';
import {MailService} from '../../shared/mail-service';
import * as fs from 'fs';
import * as path from 'path';

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

	public async create(userCreationParams: IUserModel): Promise<IUserModel> {
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

	public async sendCreateEmails(users: IUserModel[]) {
		return this.mailer.replaceAndSendEmail(users.map(e => `${e.name} <${e.username}>`), users.map(e => ({ name: e.name, password: e.password })), 'Welcome {{name}} to Amrita - EMS!', this.createUserTemplate);
	}
}
