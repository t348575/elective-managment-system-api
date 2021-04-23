import * as path from 'path';
import http from 'http';
import https from 'https';
import dotenv from 'dotenv';
import constants from './constants';
import { Logger } from './shared/logger';
import { setConstants } from './util/general-util';
dotenv.config({
    path: path.resolve(process.cwd(), `${process.env.NODE_ENV}.env`)
});
setConstants();
// @ts-ignore
const port = parseInt(process.env.port, 10) || 8080;
Logger.init();
import { app, initApp } from './app';
let server: http.Server | https.Server;
if (constants.environment === 'test') {
    server = http.createServer(app);
} else {
    server = https.createServer(
        {
            cert: constants.publicKey,
            key: constants.privateKey
        },
        app
    );
    initServer();
}
process.on('SIGINT', shutdown);
function shutdown() {
    Logger.log('Graceful shutdown...');
    Logger.log('Closed app');
    process.exit(0);
}
function initServer() {
    server.listen(port, () => {
        Logger.log(`App listening at ${process.env.serverAddress}:${port}`);
        initApp();
    });
}
export { server, initServer };
