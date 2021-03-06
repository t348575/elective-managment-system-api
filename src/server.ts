import * as path from 'path';
import fs from 'fs';
import https from 'https';
import { app } from './app';
import {ConfigModel} from './models/config-model';
import constants from './constants';
const config: ConfigModel = JSON.parse(fs.readFileSync(path.join(__dirname, './../resources/config.json')).toString());
const port = config.port || 8080;

setConstants();

const server = https.createServer({
	// @ts-ignore
	key: constants.privateKey,
	// @ts-ignore
	cert: constants.publicKey,
}, app);

process.on('SIGINT', shutdown);
function shutdown() {
	console.log('Graceful shutdown...');
	server.close(function () {
		console.log('Closed app');
		process.exit(0);
	});
}

server.listen(port, () =>
	console.log(`App listening at ${config.serverAddress}:${port}`)
);

function setConstants() {

	constants.privateKey = fs.readFileSync(path.resolve(config.privateKey)).toString();
	constants.publicKey = fs.readFileSync(path.resolve(config.publicKey)).toString();

	constants.mailAccess.host = config.mailHost;
	constants.mailAccess.username = config.mailUsername;
	constants.mailAccess.password = config.mailPassword;
	constants.mailAccess.name = config.mailName;

}