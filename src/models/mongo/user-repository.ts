import { MongoConnector } from '../../shared/mongo-connector';
import mongoose, { Document, Schema } from 'mongoose';
import { BaseRepository } from '../shared/base-repository';
import { BaseFormatter } from '../../util/base-formatter';
import { IBatchModel } from './batch-repository';
import { scopes } from '../types';
import { ApiError } from '../../shared/error-handler';
import constants from '../../constants';
import { IClassModel } from './class-repository';
import { Inject, Singleton } from 'typescript-ioc';
import { cleanQuery } from '../../util/general-util';

export interface IUserModel {
    id?: string;
    name: string;
    username: string;
    password: string;
    rollNo: string;
    role: scopes;
    batch?: IBatchModel;
    classes?: IClassModel[];
}

export class UserFormatter extends BaseFormatter implements IUserModel {
    name: string;
    username: string;
    password: string;
    role: scopes;
    rollNo: string;
    batch?: IBatchModel;
    classes?: IClassModel[];
    id: string;
    constructor(args: any) {
        super();
        this.format(args);
    }
}

export interface SafeUser {
    name: string;
    username: string;
    role: 'admin' | 'teacher' | 'student';
    rollNo: string;
    batch?: IBatchModel;
    classes?: IClassModel[];
    id: string;
}

const safeAdminRemover = ['password'];
const safeTeacherRemover = ['password'];
const safeStudentRemover = ['password'];

export function getSafeUserOmit(role: scopes): string[] {
    switch (role) {
        case 'teacher': {
            return safeTeacherRemover;
        }
        case 'student': {
            return safeStudentRemover;
        }
        case 'admin': {
            return safeAdminRemover;
        }
    }
    return [];
}

@Singleton
export class UserRepository extends BaseRepository<IUserModel> {
    protected modelName = 'users';
    protected schema: Schema = new Schema(
        {
            name: { type: String, required: true },
            username: { type: String, unique: true, required: true },
            password: { type: String, required: true },
            role: {
                type: String,
                required: true,
                enum: ['admin', 'teacher', 'student']
            },
            rollNo: { type: String, required: true },
            batch: { type: mongoose.Schema.Types.ObjectId, ref: 'batches' },
            classes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'classes' }]
        },
        { collection: this.modelName }
    );

    protected formatter = UserFormatter;
    @Inject
    protected dbConnection: MongoConnector;
    constructor() {
        super();
        this.init();
    }

    public async getPopulated(id: string, role: scopes | 'any') {
        switch (role) {
            case 'admin': {
                // @ts-ignore
                const document: Document = await this.documentModel
                    .findOne({
                        _id: mongoose.Types.ObjectId(id)
                    })
                    .select('_id rollNo name batch username classes role');
                if (!document) throw new ApiError(constants.errorTypes.notFound);
                return new this.formatter(document);
            }
            case 'any':
            case 'teacher':
            case 'student': {
                // @ts-ignore
                const document: Document = await this.documentModel
                    .findOne({ _id: mongoose.Types.ObjectId(id) })
                    .populate('batch')
                    .populate('classes')
                    .select('_id rollNo name batch username classes role');
                if (!document) throw new ApiError(constants.errorTypes.notFound);
                return new this.formatter(document);
            }
        }
    }

    public async addClassToStudents(students: string[], classId: string) {
        const session = await this.documentModel.startSession();
        await session.withTransaction(async () => {
            for (const v of students) {
                await this.documentModel.findByIdAndUpdate(v, {
                    $push: {
                        classes: classId
                    }
                });
            }
        });
        session.endSession();
    }

    public async removeClassFromStudents(students: string[], classId: string) {
        const session = await this.documentModel.startSession();
        await session.withTransaction(async () => {
            for (const v of students) {
                await this.documentModel.findByIdAndUpdate(v, {
                    $pull: {
                        // @ts-ignore
                        classes: classId
                    }
                });
            }
        });
        session.endSession();
    }

    public async getClasses(id: string) {
        // @ts-ignore
        const document: Document = await this.documentModel
            .findOne({
                _id: mongoose.Types.ObjectId(id)
            })
            .populate({
                path: 'classes',
                populate: [
                    {
                        path: 'elective'
                    },
                    {
                        path: 'teacher',
                        select: 'name username _id rollNo role classes'
                    }
                ]
            })
            .populate('batch');
        if (!document) {
            throw new ApiError(constants.errorTypes.notFound);
        }
        return new this.formatter(document).classes;
    }

    public async findAndPopulate(sort: string, query: any, skip = 0, limit = 250): Promise<UserFormatter[]> {
        const sortObject = cleanQuery(sort, this.sortQueryFormatter);
        return (
            await this.documentModel
                .find(this.cleanWhereQuery(query))
                .sort(Object.keys(sortObject).map((key) => [key, sortObject[key]]))
                .skip(skip)
                .select('name username _id rollNo role classes batch')
                .limit(limit)
                .populate('batch')
        ).map((item) => new this.formatter(item));
    }
}
