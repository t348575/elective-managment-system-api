import { ProvideSingleton } from '../../shared/provide-singleton';
import { inject } from 'inversify';
import { MongoConnector } from '../../shared/mongo-connector';
import mongoose, { Document, Schema } from 'mongoose';
import { BaseRepository } from '../shared/base-repository';
import { BaseFormatter } from '../../util/base-formatter';
import { IBatchModel } from './batch-repository';
import { scopes } from '../types';
import { ApiError } from '../../shared/error-handler';
import constants from '../../constants';
import { IClassModel } from './class-repository';

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

export function getSafeUserOmit(role: scopes) {
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
}

@ProvideSingleton(UserRepository)
export class UserRepository extends BaseRepository<IUserModel> {
    protected modelName = 'users';
    protected schema: Schema = new Schema(
        {
            name: { type: String, required: true },
            username: { type: String, unique: true, required: true },
            password: { type: String, required: true },
            role: { type: String, required: true, enum: ['admin', 'teacher', 'student'] },
            rollNo: { type: String, required: true },
            batch: { type: mongoose.Schema.Types.ObjectId, ref: 'batches' },
            classes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'classes' }]
        },
        { collection: this.modelName }
    );

    protected formatter = UserFormatter;
    constructor(@inject(MongoConnector) protected dbConnection: MongoConnector) {
        super();
        super.init();
        this.schema.set('toJSON', {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            transform: (doc: any, ret: { id: any; _id: any; __v: any }, options: any) => {
                ret.id = ret._id;
                delete ret._id;
                delete ret.__v;
            }
        });
    }

    public async getPopulated(id: string, role: scopes | 'any') {
        switch (role) {
            case 'admin': {
                // @ts-ignore
                const document: Document = await this.documentModel.findOne({ _id: mongoose.Types.ObjectId(id) });
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
                    .populate('classes');
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
}
