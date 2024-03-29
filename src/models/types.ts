/**
 * Id
 * @example "601e34401e2f8d10d060af1e"
 * @minLength 12
 * @maxLength 24
 */
import { ErrorType } from '../shared/error-handler';

export type id = string;

export type scopes = 'teacher' | 'admin' | 'student';

export type OAuthErrorTypes =
    | 'invalid_request'
    | 'unauthorized_client'
    | 'access_denied'
    | 'unsupported_response_type'
    | 'invalid_scope'
    | 'server_error'
    | 'temporarily_unavailable';

export type tokenResponse = {
    id_token: string;
    access_token: string;
    refresh_token: string;
};

export type jwtSubjects = 'oneTimeAuthCode' | 'idToken' | 'refreshToken' | 'accessToken' | 'quiz';

export type tokenBodyType = { code: string; code_verifier: string };

export type refreshTokenResponse = {
    refresh_token: string;
    access_token: string;
};

export type refreshToken = { refresh_token: string };

export type jwtToken = {
    exp: number;
    iat: number;
    stateSlice: string;
    id: string;
    scope: scopes;
    sub: jwtSubjects;
};

export type quizToken = {
    exp: number;
    iat: number;
    stateSlice: quizSubject;
    id: string;
    scope: scopes;
    sub: jwtSubjects;
};

export type quizSubject = {
    quizId: string;
    responseId: string;
    question: number;
};

export type electiveAttributes = { key: string; value: string }[];

export interface DefaultResponse {
    status: boolean;
    message?: string;
}

export interface DefaultActionResponse {
    status: boolean;
    failed: Failed[];
}

export interface Failed {
    item: any;
    reason: string;
    error?: ErrorType;
}

export const unknownServerError = 'unknown_server_error';

export const validationError = 'validation_error';

export const unautorizedError = 'unauthorized_error';
