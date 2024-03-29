import { createHash } from 'crypto';
import * as argon2 from 'argon2';
import { IUserModel } from '../models/mongo/user-repository';
import constants from '../constants';
import jwt, { VerifyErrors } from 'jsonwebtoken';
import { jwtSubjects, jwtToken, quizSubject, scopes } from '../models/types';
import { unlinkSync, mkdirSync, existsSync } from 'fs';
import * as path from 'path';
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
    if (typeof query !== 'string') {
        return query instanceof Object ? query : {};
    }

    const defaultFormatter = (key: string, value: any) => {
        if (isId(key)) {
            return value;
        }
        value = safeParse(value, value);
        if (typeof value === 'string') {
            return new RegExp(value, 'i');
        }
        return value;
    };

    const parsedQuery = safeParse(query, {});

    return Object.keys(parsedQuery)
        .map((key) => [key, parsedQuery[key]])
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

export function getJWT(
    user: IUserModel,
    state: string | quizSubject,
    expiresIn: number,
    subject: jwtSubjects,
    scope: scopes
): Promise<{ jwt: string; expiry: number }> {
    return new Promise<{ jwt: string; expiry: number }>((resolve, reject) => {
        const expiry = Math.floor(new Date().getTime() / 1000) + expiresIn;
        jwt.sign(
            { id: user.id, exp: expiry, stateSlice: state, scope: scope },
            constants.privateKey,
            { algorithm: 'RS256', subject },
            (err: Error | null, encoded: string | undefined) => {
                if (err) {
                    reject(err);
                } else if (encoded) {
                    resolve({ jwt: encoded, expiry });
                } else {
                    reject({ message: 'An unknown error' });
                }
            }
        );
    });
}

export function decipherJWT(token: string, subject: jwtSubjects, ignoreExpiration = false): Promise<jwtToken> {
    return new Promise<any>((resolve, reject) => {
        jwt.verify(
            token,
            constants.publicKey,
            { ignoreExpiration, clockTolerance: 2, subject },
            (err: VerifyErrors | null, decoded: any | undefined) => {
                if (err) {
                    reject(err);
                } else if (decoded) {
                    resolve(decoded);
                } else {
                    reject({ message: 'An unknown error' });
                }
            }
        );
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
export function checkNumber(body: any, prop: string, parse = false, parser = parseInt) {
    try {
        // eslint-disable-next-line no-prototype-builtins
        if (body.hasOwnProperty(prop)) {
            if (parse) {
                try {
                    const num = parser(body[prop], 10);
                    return !!(num !== undefined && num !== null && !isNaN(num));
                } catch (err) {
                    return false;
                }
            } else {
                return typeof body[prop] === 'number' && !isNaN(body[prop]);
            }
        } else {
            return false;
        }
    } catch (err) {
        return false;
    }
}
export function checkString(body: any, prop: string, limit?: string[], nonZero = true): boolean {
    try {
        // eslint-disable-next-line no-prototype-builtins
        if (body.hasOwnProperty(prop) && typeof body[prop] === 'string') {
            if (nonZero) {
                if (limit) {
                    return body[prop].length > 0 && limit.indexOf(body[prop]) > -1;
                } else {
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

export function removeFile(file: string) {
    try {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        unlinkSync(file);
        // eslint-disable-next-line no-empty
    } catch (err) {}
}

export function chunkArray(arr: any[], n: number) {
    if (n < 2) {
        return [arr];
    }
    const len = arr.length;
    const out = [];
    let i = 0;
    let size;
    if (len % n === 0) {
        size = Math.floor(len / n);
        while (i < len) {
            out.push(arr.slice(i, (i += size)));
        }
    } else {
        while (i < len) {
            size = Math.ceil((len - i) / n--);
            out.push(arr.slice(i, (i += size)));
        }
    }
    return out;
}

export function setConstants() {
    // @ts-ignore
    constants.port = parseInt(process.env.port, 10);
    // @ts-ignore
    constants.privateKey = Buffer.from(process.env.privateKey, 'base64').toString();
    // @ts-ignore
    constants.publicKey = Buffer.from(process.env.publicKey, 'base64').toString();

    // @ts-ignore
    constants.baseUrl = process.env.serverAddress;

    // @ts-ignore
    constants.vapidKeys.privateKey = process.env.vapidKeyPrivateKey;
    // @ts-ignore
    constants.vapidKeys.publicKey = process.env.vapidKeyPublicKey;

    // @ts-ignore
    constants.mailAccess.host = process.env.mailHost;
    // @ts-ignore
    constants.mailAccess.username = process.env.mailUsername;
    // @ts-ignore
    constants.mailAccess.password = process.env.mailPassword;
    // @ts-ignore
    constants.mailAccess.name = process.env.mailName;

    // @ts-ignore
    constants.mongoConnectionString = process.env.mongoConnectionString;
    // @ts-ignore
    constants.redisPassword = process.env.redisPassword;
    // @ts-ignore
    constants.redisHost = process.env.redisHost;

    // @ts-ignore
    constants.environment = process.env.NODE_ENV;

    if (!existsSync(path.join(__dirname, '/../../resources'))) {
        mkdirSync(path.join(__dirname, '/../../resources'));
    }

    for (const v in constants.directories) {
        // @ts-ignore
        const name = removeFirstOccurance(constants.directories[v] as string, '/../');
        if (!existsSync(path.join(__dirname, name))) {
            // @ts-ignore
            mkdirSync(path.join(__dirname, name));
        }
    }
}
export function removeFirstOccurance(str: string, searchStr: string): string {
    const index = str.indexOf(searchStr);
    if (index === -1) {
        return str;
    }
    return str.slice(0, index) + str.slice(index + searchStr.length);
}
