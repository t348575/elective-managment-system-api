/* eslint @typescript-eslint/no-unused-vars: 0 */
import { Singleton, Inject } from 'typescript-ioc';
import { BatchRepository } from '../models/mongo/batch-repository';
import { ElectiveRepository } from '../models/mongo/elective-repository';
import { UserRepository } from '../models/mongo/user-repository';
import { PasswordResetRepository } from '../models/mongo/password-reset-repository';
import { ClassRepository } from '../models/mongo/class-repository';
import { FormsRepository } from '../models/mongo/form-repository';
import { ResponseRepository } from '../models/mongo/response-repository';
import { DownloadRepository } from '../models/mongo/download-repository';
import { NotificationRepository } from '../models/mongo/notification-repository';
import { TrackRepository } from '../models/mongo/track-repository';
import { RedisConnector } from '../shared/redis-connector';

@Singleton
export class PrivateInjectorInit {
    @Inject batchRepository: BatchRepository;
    @Inject electiveRepository: ElectiveRepository;
    @Inject userRepository: UserRepository;
    @Inject passwordResetRepository: PasswordResetRepository;
    @Inject classRepository: ClassRepository;
    @Inject formRepository: FormsRepository;
    @Inject responseRepository: ResponseRepository;
    @Inject downloadRepository: DownloadRepository;
    @Inject notificationsRepository: NotificationRepository;
    @Inject trackRepository: TrackRepository;
    @Inject redisConnector: RedisConnector
    constructor() {
        this.batchRepository;
        this.electiveRepository;
        this.userRepository;
        this.passwordResetRepository;
        this.classRepository;
        this.formRepository;
        this.responseRepository;
        this.downloadRepository;
        this.notificationsRepository;
        this.trackRepository;
        this.redisConnector;
    }
}
