/* eslint-disable @typescript-eslint/no-unused-vars */
import { Response as ExResponse } from 'express';
import { spy } from 'sinon';

export class MockDownloadService {

    public async addTemporaryUserLink(userIds: string, path: string): Promise<string> {
        return new Promise<string>(async (resolve) => {
            resolve('mock_file_id');
        });
    }

    public async getTemporaryFile(fileId: string, userId: string, res: ExResponse): Promise<null> {
        return new Promise<null>(async (resolve) => {
            resolve(null);
        });
    }
}

export const mockAddTemporaryUserLink = spy(MockDownloadService.prototype, 'addTemporaryUserLink');
