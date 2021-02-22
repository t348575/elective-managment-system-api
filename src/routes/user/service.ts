import {ProvideSingleton} from '../../shared/provide-singleton';
import { inject } from 'inversify';
import {IUserModel, UserFormatter, UserRepository} from '../../models/mongo/user-repository';
import {BaseService} from '../../models/shared/base-service';
import mongoose from 'mongoose';

@ProvideSingleton(UsersService)
export class UsersService extends BaseService<IUserModel> {

	constructor(
		@inject(UserRepository) protected repository: UserRepository
	) {
		super();
	}

	public async get(userId: string) {
		return this.repository.getById(userId);
	}

	public async create(userCreationParams: IUserModel): Promise<IUserModel> {
		const newUser = new UserFormatter({
			name: userCreationParams.name,
			password: userCreationParams.password
		});
		return this.repository.create(newUser);
	}
}
