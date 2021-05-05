import { Controller, Get, Query, Response, Route, Security, Tags, Request, Delete } from 'tsoa';
import { Request as ExRequest } from 'express';
import { ClassService } from './service';
import { Inject, Singleton } from 'typescript-ioc';
import { ErrorType } from '../../shared/error-handler';
import { jwtToken, unknownServerError, validationError } from '../../models/types';
import { PaginationModel } from '../../models/shared/pagination-model';
import { IClassModel } from '../../models/mongo/class-repository';

const adminOnly: string[] = ['admin'];
const studentOrTeacher: string[] = ['student', 'teacher'];
const teacherOrAdmin: string[] = ['teacher', 'admin'];
const scopeArray: string[] = ['admin', 'teacher', 'student'];

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
    @Security('jwt', scopeArray)
    @Response<ErrorType>(401, validationError)
    @Response<ErrorType>(500, unknownServerError)
    public async getClasses(
        @Query('sortBy') sortBy: 'batch' | 'teacher' | 'elective',
        @Query('dir') dir: 'asc' | 'desc',
        @Query('page') page: number,
        @Request() request: ExRequest,
        @Query('id') id?: string,
        @Query('batch') batch?: string,
        @Query('teacher') teacher?: string,
        @Query('pageSize') pageSize = 25
    ): Promise<PaginationModel<IClassModel>> {
        const query = {};
        if (batch) {
            // @ts-ignore
            query.batch = batch;
        }
        if (teacher) {
            // @ts-ignore
            query.teacher = teacher;
        }
        // @ts-ignore
        const accessToken = request.user as jwtToken;
        switch (accessToken.scope) {
            case 'teacher': {
                // @ts-ignore
                query.teacher = accessToken.id;
                break;
            }
            case 'student': {
                // @ts-ignore
                query.students = accessToken.id;
                break;
            }
        }
        return this.service.getPaginated<IClassModel>(page, pageSize, '', JSON.stringify({ [sortBy]: dir }), query);
    }

    @Get('active')
    @Security('jwt', studentOrTeacher)
    @Response<ErrorType>(401, validationError)
    @Response<ErrorType>(500, unknownServerError)
    public async getActiveClasses(@Request() request: ExRequest) {
        // @ts-ignore
        const accessToken = request.user as jwtToken;
        return this.service.getActiveClasses(accessToken.id);
    }

    @Get('students')
    @Security('jwt', teacherOrAdmin)
    @Response<ErrorType>(401, validationError)
    @Response<ErrorType>(500, unknownServerError)
    public async getStudents(@Query() id: string) {
        return this.service.getStudents(id);
    }

    @Delete()
    @Security('jwt', adminOnly)
    @Response<ErrorType>(401, validationError)
    @Response<ErrorType>(500, unknownServerError)
    public async deleteClasses(@Query('class') classes: string): Promise<void> {
        await this.service.deleteClass(classes);
    }
}
