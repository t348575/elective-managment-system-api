import { Controller, Route, Tags } from 'tsoa';
import { ClassService } from './service';
import { provideSingleton } from '../../provide-singleton';
import { inject } from 'inversify';

@provideSingleton(ClassController)
@Tags('classes')
@Route('classes')
export class ClassController extends Controller {
    @inject(ClassService) protected service: ClassService;
    constructor() {
        super();
    }
}
