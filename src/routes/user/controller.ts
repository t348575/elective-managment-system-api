import {
	Body,
	Controller,
	Get,
	Path,
	Post,
	Query,
	Route,
	SuccessResponse,
	Security,
	Response,
	Tags
} from 'tsoa';
import {UsersService} from './service';
import {ProvideSingleton} from '../../shared/provide-singleton';
import {inject} from 'inversify';
import {id} from '../../models/types';
import {IUserModel} from '../../models/mongo/user-repository';

@Tags('users')
@Route('users')
@ProvideSingleton(UsersController)
export class UsersController extends Controller {

	constructor(@inject(UsersService) private service: UsersService) {
		super();
	}

	/**
	 * User related endpoints, such as get user information etc.
	 * Supply the unique user ID.
	 */
	@Get('{userId}')
	public getUser(
		@Path() userId: id
	) {
		return this.service.get(userId);
	}

	@Post()
	public addUser(
		@Body() requestBody: IUserModel
	): Promise<IUserModel> {
		return this.service.create(requestBody);
	}
}
