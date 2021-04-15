/* eslint @typescript-eslint/no-unused-vars: 0 */
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
import { MongoConnector } from '../shared/mongo-connector';
import { Logger } from '../shared/logger';
import { provideSingleton } from '../provide-singleton';
import {inject} from 'inversify';

@provideSingleton(PrivateInjectorInit)
export class PrivateInjectorInit {
    @inject() mongoConnector: MongoConnector;
    @inject() batchRepository: BatchRepository;
    @inject() electiveRepository: ElectiveRepository;
    @inject() userRepository: UserRepository;
    @inject() passwordResetRepository: PasswordResetRepository;
    @inject() classRepository: ClassRepository;
    @inject() formRepository: FormsRepository;
    @inject() responseRepository: ResponseRepository;
    @inject() downloadRespository: DownloadRespository;
    @inject() notificationsRepository: NotificationRepository;
    @inject() trackRepository: TrackRepository;
    constructor() {
        Logger.log(this.mongoConnector.db.name);
        this.batchRepository.test();
        this.electiveRepository.test();
        this.userRepository.test();
        this.passwordResetRepository.test();
        this.classRepository.test();
        this.formRepository.test();
        this.responseRepository.test();
        this.downloadRespository.test();
        this.notificationsRepository.test();
        this.trackRepository.test();
    }
}
