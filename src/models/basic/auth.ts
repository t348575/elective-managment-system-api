import {BaseFormatter} from '../../util/base-formatter';

export interface IAuthTokenRequest {
	grant_type: 'password';
	username: string;
	password: string;
}

export interface IAuthTokenResponse {

}

export class AuthTokenRequestFormatter extends BaseFormatter implements IAuthTokenRequest {
	grant_type: 'password';
	username: string;
	password: string
	constructor(args: any) {
		super();
		this.format(args);
	}
}
