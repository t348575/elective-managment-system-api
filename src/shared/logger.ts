import * as logger from 'winston';
import constants from '../constants';
const date = new Date();
const fileName = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}.log`;

export class Logger {
    public static shouldLog: boolean = constants.environment !== 'test';
    public static readonly console = logger;

    public static init() {
        Logger.shouldLog = constants.environment !== 'test';
        logger.configure({
            level: constants.environment,
            format: logger.format.combine(logger.format.colorize(), logger.format.simple()),
            transports: [
                new logger.transports.File({ filename: `logs/${fileName}`, level: constants.environment }),
                new logger.transports.Console()
            ]
        });
    }

    public static log(...args: any[]): void {
        if (Logger.shouldLog) Logger.console.debug(Logger.formatArgs(args));
    }

    public static warn(...args: any[]): void {
        if (Logger.shouldLog) Logger.console.warn(Logger.formatArgs(args));
    }

    public static error(...args: any[]): void {
        if (Logger.shouldLog) Logger.console.error(Logger.formatArgs(args));
    }

    public static info(...args: any[]): void {
        if (Logger.shouldLog) Logger.console.info(Logger.formatArgs(args));
    }

    public static verbose(...args: any[]): void {
        if (Logger.shouldLog) Logger.console.verbose(Logger.formatArgs(args));
    }

    private static formatArgs(args: any[]): string {
        if (args.length <= 1) args = args[0];
        return JSON.stringify(args, null, 4);
    }
}
