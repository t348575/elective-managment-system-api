import {Controller} from 'tsoa';
import {ProvideSingleton} from '../../shared/provide-singleton';
import {ClassService} from './service';
import {inject} from 'inversify';

@ProvideSingleton(ClassController)
export class ClassController extends Controller {
    constructor(
        @inject(ClassService) protected service: ClassService
    ) {
        super();
    }
}
