import {ProvideSingleton} from '../shared/provide-singleton';
import {inject} from 'inversify';
import {BatchRepository} from '../models/mongo/batch-repository';
import {ElectiveRepository} from '../models/mongo/elective-repository';
import {UserRepository} from '../models/mongo/user-repository';
import {Controller, Get, Hidden, Route, Tags} from 'tsoa';
import {PasswordResetRepository} from '../models/mongo/password-reset-repository';
import {ClassRepository} from '../models/mongo/class-repository';
import {FormsRepository} from '../models/mongo/form-repository';
import {ResponseRepository} from '../models/mongo/response-repository';
import {DownloadRespository} from '../models/mongo/download-repository';

@Hidden()
@Route('private-init')
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
        @inject(DownloadRespository) downloadRespository: DownloadRespository
    ) {
        super();
    }

    @Get()
    public init() {
        return;
    }
}
