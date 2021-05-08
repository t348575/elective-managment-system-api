/* eslint-disable @typescript-eslint/no-unused-vars */

import * as Buffer from 'buffer';
import { spy } from 'sinon';
import * as stream from 'stream';
import EventEmitter from 'events';
import * as express from 'express';

let fileStore = {};

export const MockFsFilestream = {
    createWriteStream: (path: string, options: { flags: string }) => {
        return {
            write: (chunk: Buffer) => {
                // @ts-ignore
                fileStore[path] = chunk;
                return;
            },
            close: () => { return; }
        };
    },
    createReadStream: (path: string, options: { flags: stream }) => {
        return {
            emitter: new EventEmitter(),
            pipe: (res: express.Response) => {
                // @ts-ignore
                res.body = fileStore[path];
                return;
            },
            on: (event: 'close' | 'error', callback: (err: Error | undefined) => void) => {
                if (event === 'close') {
                    setTimeout(() => {
                        callback(undefined);
                    }, 150);
                }
            }
        };
    },
    cleanup: () => {
        fileStore = {};
    }
};

export const mockCreateWriteStream = spy(MockFsFilestream, 'createWriteStream');
export const mockCreateReadStream = spy(MockFsFilestream, 'createReadStream');
