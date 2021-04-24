import { Controller, Get, Query, Response, Route, Security, Tags, Request, Delete, Body } from 'tsoa';
import { Request as ExRequest } from 'express';
import { ClassService } from './service';
import { Inject, Singleton } from 'typescript-ioc';
import { ErrorType } from '../../shared/error-handler';
import { jwtToken, unknownServerError, validationError } from '../../models/types';
import { IPaginationModel, PaginationModel } from '../../models/shared/pagination-model';
import { IClassModel } from '../../models/mongo/class-repository';

const teacherOrAdmin: string[] = ['admin', 'teacher'];
const studentOnly: string[] = ['student'];
const adminOnly: string[] = ['admin'];

@Singleton
@Tags('classes')
@Route('classes')
export class ClassController extends Controller {
    @Inject
    protected service: ClassService;
    constructor() {
        super();
    }

    @Get('')
    @Security('jwt', teacherOrAdmin)
    @Response<ErrorType>(401, validationError)
    @Response<ErrorType>(500, unknownServerError)
    public async getClasses(
        @Query('sortBy') sortBy: 'batch' | 'teacher' | 'elective',
        @Query('dir') dir: 'asc' | 'desc',
        @Query('page') page: number,
        @Query('batch') batch?: string,
        @Query('teacher') teacher?: string,
        @Query('pageSize') pageSize = 25
    ): Promise<PaginationModel<IClassModel>> {
        return this.service.getPaginated<IClassModel>(page, pageSize, '', JSON.stringify({ [sortBy]: dir }), { batch, teacher, active: true });
    }

    @Get('active')
    @Security('jwt', studentOnly)
    @Response<ErrorType>(401, validationError)
    @Response<ErrorType>(500, unknownServerError)
    public async getActiveClasses(@Request() request: ExRequest) {
        // @ts-ignore
        const accessToken = request.user as jwtToken;
        return this.service.getActiveClasses(accessToken.id);
    }

    @Delete()
    @Security('jwt', adminOnly)
    @Response<ErrorType>(401, validationError)
    @Response<ErrorType>(500, unknownServerError)
    public async deleteClasses(
        @Body() classes: string[]
    ) {
        // TODO: class deletion
    }
}
