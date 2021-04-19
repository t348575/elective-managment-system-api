import { SuperTest } from 'supertest';
import crypto from 'crypto';
import testingConstants from './testing-constants';
import { Base64 } from 'js-base64';
import { sha256 } from 'js-sha256';
import * as qs from 'query-string';
import { setConstants } from '../util/general-util';
import dotenv from 'dotenv';
import path from 'path';
import { MongoMemoryServer } from 'mongodb-memory-server';
import constants from '../constants';
dotenv.config({
    path: path.resolve(process.cwd(), `${process.env.NODE_ENV}.env`)
});
export class IntegrationHelper {
    public app: SuperTest<any>;

    public id_token: string;
    public access_token: string;
    public refresh_token: string;

    public db: MongoMemoryServer;

    constructor(app: SuperTest<any>) {
        setConstants();
        this.app = app;
    }

    async initMongoMemoryServer() {
        this.db = new MongoMemoryServer();
        constants.mongoConnectionString = await this.db.getUri();
    }

    async login() {
        const code_verifier = crypto.randomBytes(32).toString('hex');
        const code_challenge = Base64.fromUint8Array(testingConstants.fromHexString(sha256(code_verifier)));
        const args = {
            response_type: 'code',
            client_id: 'api',
            redirect_uri: 'http://localhost:3000',
            scope: 'admin',
            state: crypto.randomBytes(24).toString('hex'),
            username: testingConstants.username,
            password: testingConstants.password,
            code_challenge,
            code_challenge_method: 'S256'
        };
        const res = await this.app.get(testingConstants.oauth.loginRoute).query(args);
        const resParam = qs.parseUrl(res.header.location);
        const resToken = await this.app
            .post(testingConstants.oauth.tokenRoute)
            .send({ code_verifier, code: resParam.query.code });
        this.id_token = resToken.body.id_token;
        this.refresh_token = resToken.body.refresh_token;
        this.access_token = resToken.body.access_token;
    }

    getBearer() {
        return `Bearer ${this.access_token}`;
    }
}
