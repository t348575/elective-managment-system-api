import { Controller, Get, Query, Response, Route, Security, Tags, Request, Delete, Body, Post } from 'tsoa';
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
const studentOnly: string[] = ['student'];

export interface RequestElectiveChangeOptions {
    from: string;
    to: string;
}

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
        return this.service.getPaginated(page, pageSize, '', JSON.stringify({ [sortBy]: dir }), query);
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

    @Post('request-elective-change')
    @Security('jwt', studentOnly)
    @Response<ErrorType>(401, validationError)
    @Response<ErrorType>(500, unknownServerError)
    public async requestElectiveChange(@Body() options: RequestElectiveChangeOptions, @Request() request: ExRequest) {
        // @ts-ignore
        const accessToken = request.user as jwtToken;
        return this.service.addElectiveChange(options, accessToken.id);
    }

    @Get('request-elective-change')
    @Security('jwt', adminOnly)
    @Response<ErrorType>(401, validationError)
    @Response<ErrorType>(500, unknownServerError)
    public async getElectiveChangeRequests() {
        return this.service.getElectiveChanges();
    }

    @Post('confirm-elective-change')
    @Security('jwt', adminOnly)
    @Response<ErrorType>(401, validationError)
    @Response<ErrorType>(500, unknownServerError)
    public async confirmElectiveChange(@Query() id: string) {
        return this.service.confirmElectiveChange(id);
    }

    @Delete('remove-change-request')
    @Security('jwt', adminOnly)
    @Response<ErrorType>(401, validationError)
    @Response<ErrorType>(500, unknownServerError)
    public async deleteElectiveChange(@Query() id: string) {
        return this.service.deleteElectiveChange(id);
    }

    @Get('valid-request-electives')
    @Security('jwt', studentOnly)
    @Response<ErrorType>(401, validationError)
    @Response<ErrorType>(500, unknownServerError)
    public async getValidRequestElectives(@Request() request: ExRequest) {
        // @ts-ignore
        const accessToken = request.user as jwtToken;
        return this.service.getValidRequestElectives(accessToken.id);
    }

    @Get('can-request-elective-change')
    @Security('jwt', studentOnly)
    @Response<ErrorType>(401, validationError)
    @Response<ErrorType>(500, unknownServerError)
    public async canRequestElectiveChange(@Request() request: ExRequest) {
        // @ts-ignore
        const accessToken = request.user as jwtToken;
        return (await this.service.canRequestElectiveChange(accessToken.id)).length >= 1;
    }
}
