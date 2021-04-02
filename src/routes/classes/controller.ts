import { Controller, Route, Tags } from 'tsoa';
import { ClassService } from './service';
import { Inject, Singleton } from 'typescript-ioc';

@Singleton
@Tags('classes')
@Route('classes')
export class ClassController extends Controller {
    @Inject
    protected service: ClassService;
    constructor() {
        super();
    }
}
