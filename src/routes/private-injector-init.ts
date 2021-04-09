/* eslint @typescript-eslint/no-unused-vars: 0 */
import { Inject } from 'typescript-ioc';
import { BatchRepository } from '../models/mongo/batch-repository';
import { ElectiveRepository } from '../models/mongo/elective-repository';
import { UserRepository } from '../models/mongo/user-repository';
import { PasswordResetRepository } from '../models/mongo/password-reset-repository';
import { ClassRepository } from '../models/mongo/class-repository';
import { FormsRepository } from '../models/mongo/form-repository';
import { ResponseRepository } from '../models/mongo/response-repository';
import { DownloadRespository } from '../models/mongo/download-repository';
import { NotificationRepository } from '../models/mongo/notification-repository';
import { TrackRepository } from '../models/mongo/track-repository';
import { Singleton } from 'typescript-ioc';
import * as fs from 'fs';
@Singleton
export class PrivateInjectorInit {
    @Inject batchRepository: BatchRepository;
    @Inject electiveRepository: ElectiveRepository;
    @Inject userRepository: UserRepository;
    @Inject passwordResetRepository: PasswordResetRepository;
    @Inject classRepository: ClassRepository;
    @Inject formRepository: FormsRepository;
    @Inject responseRepository: ResponseRepository;
    @Inject downloadRespository: DownloadRespository;
    @Inject notificationsRepository: NotificationRepository;
    @Inject trackRepository: TrackRepository;
    constructor() {
        this.batchRepository;
        this.electiveRepository;
        this.userRepository;
        this.passwordResetRepository;
        this.classRepository;
        this.formRepository;
        this.responseRepository;
        this.downloadRespository;
        this.notificationsRepository;
        this.trackRepository;
    }
}
