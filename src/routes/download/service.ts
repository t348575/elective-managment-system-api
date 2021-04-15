import { DownloadRespository, IDownloadModel } from '../../models/mongo/download-repository';
import { BaseService } from '../../models/shared/base-service';
import { randomBytes } from 'crypto';
import { IUserModel, UserRepository } from '../../models/mongo/user-repository';
import { OAuthError } from '../../shared/error-handler';
import { Response as ExResponse } from 'express';
import { createReadStream } from 'fs';
import { removeTempFile } from '../../util/general-util';
import { Inject, Singleton } from 'typescript-ioc';

@Singleton
export class DownloadService extends BaseService<IDownloadModel> {
    @Inject
    protected repository: DownloadRespository;
    @Inject
    protected userRepository: UserRepository;
    constructor() {
        super();
    }

    public async addTemporaryUserLink(userIds: string, path: string): Promise<string> {
        return new Promise<string>(async (resolve, reject) => {
            try {
                const fileId = randomBytes(64).toString('hex');
                await this.repository.create({
                    limitedBy: 'user',
                    // @ts-ignore
                    limitedTo: userIds,
                    shouldTrack: false,
                    deleteOnAccess: true,
                    path: path,
                    fileId
                });
                resolve(fileId);
            } catch (err) {
                reject(err);
            }
        });
    }

    public async getTemporaryFile(fileId: string, userId: string, res: ExResponse): Promise<null> {
        return new Promise<null>(async (resolve, reject) => {
            const user: IUserModel = await this.userRepository.getById(userId);
            const file = await this.repository.findOne({ fileId });
            switch (file.limitedBy) {
                case 'user': {
                    // @ts-ignore
                    if (file.limitedTo.indexOf(user.id) === -1) {
                        return reject(
                            new OAuthError({
                                name: 'access_denied',
                                error_description: 'user does not have access to this file'
                            })
                        );
                    }
                    break;
                }
            }
            const readStream = createReadStream(file.path, { flags: 'r' });
            readStream.pipe(res);
            readStream.on('close', (err: Error) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(null);
                    if (file.deleteOnAccess && file.id != null) {
                        this.repository.delete(file.id).then().catch();
                        removeTempFile(file.path);
                    }
                }
            });
            readStream.on('error', (err) => {
                reject(err);
            });
        });
    }
}
