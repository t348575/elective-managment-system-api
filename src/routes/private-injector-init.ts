/* eslint @typescript-eslint/no-unused-vars: 0 */
import { ProvideSingleton } from '../shared/provide-singleton';
import { inject } from 'inversify';
import { BatchRepository } from '../models/mongo/batch-repository';
import { ElectiveRepository } from '../models/mongo/elective-repository';
import { UserRepository } from '../models/mongo/user-repository';
import { Controller, Get, Hidden, Route } from 'tsoa';
import { PasswordResetRepository } from '../models/mongo/password-reset-repository';
import { ClassRepository } from '../models/mongo/class-repository';
import { FormsRepository } from '../models/mongo/form-repository';
import { ResponseRepository } from '../models/mongo/response-repository';
import { DownloadRespository } from '../models/mongo/download-repository';
import { NotificationRepository } from '../models/mongo/notification-repository';
import { TrackRepository } from '../models/mongo/track-repository';

@Hidden()
@Route('private-init')
// eslint-disable-next-line no-use-before-define
@ProvideSingleton(PrivateInjectorInit)
export class PrivateInjectorInit extends Controller {
    constructor(
        @inject(BatchRepository) batchRepository: BatchRepository,
        @inject(ElectiveRepository) electiveRepository: ElectiveRepository,
        @inject(UserRepository) userRepository: UserRepository,
        @inject(PasswordResetRepository) passwordResetRepository: PasswordResetRepository,
        @inject(ClassRepository) classRepository: ClassRepository,
        @inject(FormsRepository) formRepository: FormsRepository,
        @inject(ResponseRepository) responseRepository: ResponseRepository,
        @inject(DownloadRespository) downloadRespository: DownloadRespository,
        @inject(NotificationRepository) notificationsRepository: NotificationRepository,
        @inject(TrackRepository) trackRepository: TrackRepository
    ) {
        super();
    }

    @Get()
    public init() {
        return;
    }
}
