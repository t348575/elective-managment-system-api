import constants from '../constants';
import {ConfigModel} from '../models/config-model';
import fs from 'fs';
import path from 'path';
import {Logger} from '../shared/logger';
export const init = () => {
    const config: ConfigModel = JSON.parse(fs.readFileSync(path.join(__dirname, './../../resources/config.json')).toString());
    constants.privateKey = fs.readFileSync(path.resolve(config.privateKey)).toString();
    constants.publicKey = fs.readFileSync(path.resolve(config.publicKey)).toString();
    // @ts-ignore
    constants.environment = process.env.NODE_ENV;
    Logger.init();
};
