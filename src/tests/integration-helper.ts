import { SuperTest } from 'supertest';
import crypto from 'crypto';
import { Base64 } from 'js-base64';
import { sha256 } from 'js-sha256';
import * as qs from 'query-string';
import { setConstants } from '../util/general-util';
import dotenv from 'dotenv';
import path from 'path';
import { MongoMemoryServer } from 'mongodb-memory-server';
import constants from '../constants';
import { setupMockUsers } from './models/user.model';
import { IUserModel } from '../models/mongo/user-repository';
import { scopes } from '../models/types';
dotenv.config({
    path: path.resolve(process.cwd(), `${process.env.NODE_ENV}.env`)
});
export class IntegrationHelper {
    public app: SuperTest<any>;

    public id_token: string;
    public access_token: string;
    public refresh_token: string;
    public users: IUserModel[];

    public db: MongoMemoryServer;

    constructor(app: SuperTest<any>) {
        setConstants();
        this.app = app;
    }

    async initMongoMemoryServer() {
        this.db = new MongoMemoryServer();
        constants.mongoConnectionString = await this.db.getUri();
        this.users = await setupMockUsers();
    }

    async login(scope: scopes = 'admin') {
        const code_verifier = crypto.randomBytes(32).toString('hex');
        const code_challenge = Base64.fromUint8Array(fromHexString(sha256(code_verifier)));
        let idx;
        switch (scope) {
            case 'admin': {
                idx = this.users.length - 1;
                break;
            }
            case 'teacher': {
                idx = this.users.length - 3;
                break;
            }
            case 'student': {
                idx = this.users.length - 15;
            }
        }
        const args = {
            response_type: 'code',
            client_id: 'api',
            redirect_uri: 'http://localhost:3000',
            scope: 'admin',
            state: crypto.randomBytes(24).toString('hex'),
            username: this.users[idx].username,
            password: 'admin',
            code_challenge,
            code_challenge_method: 'S256'
        };
        const res = await this.app.get('/oauth/authorize').query(args);
        const resParam = qs.parseUrl(res.header.location);
        const resToken = await this.app
            .post('/oauth/token')
            .send({ code_verifier, code: resParam.query.code });
        this.id_token = resToken.body.id_token;
        this.refresh_token = resToken.body.refresh_token;
        this.access_token = resToken.body.access_token;
    }

    getBearer() {
        return `Bearer ${this.access_token}`;
    }
}

export function fromHexString(hexString: string) {
    // @ts-ignore
    return new Uint8Array(hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
}
