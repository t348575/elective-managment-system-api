import {ProvideSingleton} from '../shared/provide-singleton';
import {inject} from 'inversify';
import {BatchRepository} from '../models/mongo/batch-repository';
import {ElectiveRepository} from '../models/mongo/elective-repository';
import {UserRepository} from '../models/mongo/user-repository';
import {Controller, Get, Hidden, Route, Tags} from 'tsoa';

@Hidden()
@Route('private-init')
@ProvideSingleton(PrivateInjectorInit)
export class PrivateInjectorInit extends Controller {
    constructor(
        @inject(BatchRepository) batchRepository: BatchRepository,
        @inject(ElectiveRepository) electiveRepository: ElectiveRepository,
        @inject(UserRepository) userRepository: UserRepository
    ) {
        super();
    }

    @Get()
    public init() {
        return;
    }
}