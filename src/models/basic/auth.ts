export interface IAuthTokenRequest {
    grant_type: 'password';
    username: string;
    password: string;
}
