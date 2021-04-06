import * as path from 'path';
import fs from 'fs';
import http from 'http';
import { ConfigModel } from './models/config-model';
import constants from './constants';
import { Logger } from './shared/logger';
const config: ConfigModel = JSON.parse(fs.readFileSync(path.join(__dirname, './../resources/config.json')).toString());
const port = config.port || 8080;
setConstants();
Logger.init();
import { app } from './app';
const server: http.Server = http.createServer(app);
/*if (constants.environment === 'test') {
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
}*/

process.on('SIGINT', shutdown);
function shutdown() {
    Logger.log('Graceful shutdown...');
    Logger.log('Closed app');
    process.exit(0);
}

server.listen(port, () => Logger.log(`App listening at ${config.serverAddress}:${port}`));

function setConstants() {
    constants.port = config.port;
    constants.privateKey = fs.readFileSync(path.resolve(config.privateKey)).toString();
    constants.publicKey = fs.readFileSync(path.resolve(config.publicKey)).toString();

    constants.vapidKeys.privateKey = config.vapidKeys.privateKey;
    constants.vapidKeys.publicKey = config.vapidKeys.publicKey;

    constants.mailAccess.host = config.mailHost;
    constants.mailAccess.username = config.mailUsername;
    constants.mailAccess.password = config.mailPassword;
    constants.mailAccess.name = config.mailName;

    // @ts-ignore
    constants.environment = process.env.NODE_ENV;
}

export { server };
