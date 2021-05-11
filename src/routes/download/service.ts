import { DownloadRepository, IDownloadModel } from '../../models/mongo/download-repository';
import { BaseService } from '../../models/shared/base-service';
import { randomBytes } from 'crypto';
import { IUserModel, UserRepository } from '../../models/mongo/user-repository';
import { ApiError } from '../../shared/error-handler';
import { Response as ExResponse, Request as ExRequest } from 'express';
import { createReadStream, createWriteStream } from 'fs';
import { removeFile } from '../../util/general-util';
import { Inject, Singleton } from 'typescript-ioc';
import constants from '../../constants';
import { ClassRepository, IClassModel } from '../../models/mongo/class-repository';
import { AddClassResourceOptions } from './controller';
import * as path from 'path';
import { scopes } from '../../models/types';

@Singleton
export class DownloadService extends BaseService<IDownloadModel> {
    @Inject
    protected repository: DownloadRepository;
    @Inject
    protected userRepository: UserRepository;
    @Inject private classRepository: ClassRepository;
    constructor() {
        super();
    }

    public async addTemporaryUserLink(userIds: string[], path: string, name: string): Promise<string> {
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
                    fileId,
                    name
                });
                resolve(fileId);
            } catch (err) {
                reject(err);
            }
        });
    }

    public async addClassResource(options: AddClassResourceOptions, request: ExRequest): Promise<string> {
        const classItem: IClassModel = await this.classRepository.getById(options.classId);
        const fileId = randomBytes(64).toString('hex');
        const filePath = path.join(__dirname, constants.directories.classResources, fileId);
        const writeStream = createWriteStream(filePath, { flags: 'w+' });
        writeStream.write(request.file.buffer);
        writeStream.close();
        const item = await this.repository.create({
            limitedBy: 'class',
            // @ts-ignore
            limitedToClass: options.classId,
            shouldTrack: options.shouldTrack,
            deleteOnAccess: false,
            path: filePath,
            fileId,
            name: request.file.originalname,
            trackAccess: []
        });
        // @ts-ignore
        await this.classRepository.addResource(classItem.id, item.id);
        return fileId;
    }

    public async getTemporaryFile(fileId: string, userId: string, res: ExResponse): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            const user: IUserModel = await this.userRepository.getById(userId);
            const file = await this.repository.findOne({ fileId });
            switch (file.limitedBy) {
                case 'user': {
                    // @ts-ignore
                    if (file.limitedTo.indexOf(user.id) === -1) {
                        return reject(new ApiError(constants.errorTypes.forbidden));
                    }
                    break;
                }
            }
            await this.downloadResource(file, res);
            resolve();
        });
    }

    public async getClassResource(fileId: string, userId: string, res: ExResponse): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            const user: IUserModel = await this.userRepository.getById(userId);
            const file = await this.repository.findOne({ fileId });
            if (file.limitedBy === 'class') {
                const itemClasses = await this.classRepository.find(
                    '',
                    { _id: { $in: file.limitedToClass } },
                    undefined,
                    0
                );
                switch (user.role) {
                    case 'student': {
                        // @ts-ignore
                        if (itemClasses.findIndex((e) => e.students.indexOf(user.id) > -1) === -1) {
                            return reject(new ApiError(constants.errorTypes.forbidden));
                        }
                        if (file.shouldTrack) {
                            // @ts-ignore
                            await this.repository.addTrack(file, user.id);
                        }
                        break;
                    }
                    case 'teacher': {
                        // @ts-ignore
                        if (itemClasses.findIndex((e) => e.teacher === user.id) === -1) {
                            return reject(new ApiError(constants.errorTypes.forbidden));
                        }
                        break;
                    }
                }
                await this.downloadResource(file, res);
                resolve();
            } else {
                return reject(new ApiError(constants.errorTypes.forbidden));
            }
        });
    }

    private downloadResource(file: IDownloadModel, resObj: ExResponse): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const readStream = createReadStream(file.path, { flags: 'r' });
            readStream.pipe(resObj);
            readStream.on('close', (err: Error) => {
                if (err) {
                    reject(err);
                } else {
                    if (file.deleteOnAccess && file.id != null) {
                        this.repository.delete(file.id).then().catch();
                        removeFile(file.path);
                    }
                    resolve();
                }
            });
            readStream.on('error', (err: Error) => reject(err));
        });
    }

    public async deleteClassResource(fileId: string, userId: string, scope: scopes) {
        const file = await this.repository.findOne({ fileId });
        const classItem: IClassModel = await this.classRepository.getById((file.limitedToClass as unknown) as string);
        if (scope === 'admin' || ((classItem.teacher as unknown) as string) === userId) {
            await this.classRepository.deleteResource(classItem.id as string, file.id as string);
            removeFile(path.join(__dirname, constants.directories.classResources, fileId));
            await this.repository.delete(file.id as string);
        } else {
            throw new ApiError(constants.errorTypes.forbidden);
        }
    }

    public async getTrackedClassResource(fileId: string, userId: string, scope: scopes): Promise<IDownloadModel> {
        const file = await this.repository.findAndPopulate(fileId);
        const classItem: IClassModel = await this.classRepository.getById((file.limitedToClass as unknown) as string);
        if (scope === 'admin' || ((classItem.teacher as unknown) as string) === userId) {
            return file;
        } else {
            throw new ApiError(constants.errorTypes.forbidden);
        }
    }
}
