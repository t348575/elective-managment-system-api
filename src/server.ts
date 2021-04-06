import * as path from 'path';
import http from 'http';
import https from 'https';
import dotenv from 'dotenv';
import constants from './constants';
import { Logger } from './shared/logger';
dotenv.config({
    path: path.resolve(process.cwd(), process.env.NODE_ENV + '.env')
});
setConstants();
// @ts-ignore
const port = parseInt(process.env.port, 10) || 8080;
Logger.init();
import { app } from './app';
let server: http.Server | https.Server;
if (constants.environment === 'test') {
    server = http.createServer(app);
} else {
    server = https.createServer(
        {
            // @ts-ignore
            key: constants.privateKey,
            // @ts-ignore
            cert: constants.publicKey
        },
        app
    );
}
process.on('SIGINT', shutdown);
function shutdown() {
    Logger.log('Graceful shutdown...');
    Logger.log('Closed app');
    process.exit(0);
}

server.listen(port, () => Logger.log(`App listening at ${process.env.serverAddress}:${port}`));

function setConstants() {
    // @ts-ignore
    constants.port = parseInt(process.env.port, 10);
    // @ts-ignore
    constants.privateKey = Buffer.from(process.env.privateKey, 'base64').toString();
    // @ts-ignore
    constants.publicKey = Buffer.from(process.env.publicKey, 'base64').toString();

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
    constants.environment = process.env.NODE_ENV;
}

export { server, setConstants };
