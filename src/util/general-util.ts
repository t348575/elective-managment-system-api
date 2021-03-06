import { Request } from 'express';
import multer from 'multer';
import * as jwt from 'jsonwebtoken';
import {createHash} from 'crypto';
import * as argon2 from 'argon2';
import {IUserModel} from '../models/mongo/user-repository';
import constants from '../constants';
import {VerifyErrors} from 'jsonwebtoken';
import {jwtSubjects, jwtToken, scopes} from '../models/types';
export const safeParse = (str: string, fallback: any = undefined) => {
	try {
		return JSON.parse(str);
	} catch {
		return fallback;
	}
};

export const isId = (key: string): boolean => key === 'id' || key === '_id' || /Id$/.test(key);

export const cleanQuery = (
	query: string | any = '',
	customFormatter?: (key: string, value: any) => any
): { [key: string]: any } => {
	if (typeof query !== 'string') return query instanceof Object ? query : {};

	const defaultFormatter = (key: string, value: any) => {
		if (isId(key)) return value;
		value = safeParse(value, value);
		if (typeof value === 'string') return new RegExp(value, 'i');
		return value;
	};

	const parsedQuery = safeParse(query, {});

	return Object.keys(parsedQuery)
		.map(key => [key, parsedQuery[key]])
		.reduce((fullQuery, queryChunk) => {
			const key: string = queryChunk[0];
			const value: any = (customFormatter || defaultFormatter)(key, queryChunk[1]);

			if (key && value !== undefined) {
				// @ts-ignore
				fullQuery[key] = value;
			}

			return fullQuery;
		}, {});
};

export const parseMultiPartRequest = async (request: Request): Promise<void> => {
	return new Promise<void>((resolve, reject) => {
		// @ts-ignore
		multer().any()(request, undefined, async (error: any) => {
			if (error) reject(error);
			resolve();
		});
	});
};

export function getJWT(user: IUserModel, state: string, expiresIn: number, subject: jwtSubjects, scope: scopes): Promise<{ jwt: string, expiry: number }> {
	return new Promise<{ jwt: string, expiry: number }>((resolve, reject) => {
		const expiry = Math.floor(new Date().getTime() / 1000) + expiresIn;
		jwt.sign({ id: user.id, exp: expiry, stateSlice: state, scope: scope }, constants.privateKey, { algorithm: 'RS256', subject }, (err: Error | null, encoded: string | undefined) => {
			if (err) {
				reject(err);
			}
			else if (encoded) {
				resolve({ jwt: encoded, expiry });
			}
			else {
				reject({ message: 'An unknown error' });
			}
		});
	});
}

export function decipherJWT(token: string, subject: jwtSubjects, ignoreExpiration = false): Promise<jwtToken> {
	return new Promise<any>((resolve, reject) => {
		jwt.verify(token, constants.publicKey, { ignoreExpiration, clockTolerance: 2, subject }, (err: VerifyErrors | null, decoded: any | undefined) => {
			if (err) {
				reject(err);
			}
			else if (decoded) {
				resolve(decoded);
			}
			else {
				reject({ message: 'An unknown error' });
			}
		});
	});
}

export function getSHA256(str: string): string {
	return urlSafe(createHash('sha256').update(str).digest('base64'));
}

export function urlSafe(str: string) {
	str = str.replace(/\+/g, '-');
	str = str.replace(/\//g, '_');
	str = str.replace(/=/g, '');
	return str;
}

export function checkString(body: any, prop: string, limit ?: string[], nonZero = true): boolean {
	try {
		if (body.hasOwnProperty(prop) && typeof body[prop] === 'string') {
			if (nonZero) {
				if (limit) {
					return body[prop].length > 0 && limit.indexOf(body[prop]) > -1;
				}
				else {
					return body[prop].length > 0;
				}
			} else {
				return true;
			}
		}
		return false;
	} catch (e) {
		return false;
	}
}

export async function getArgonHash(str: string) {
	return argon2.hash(str);
}