import { IBatchModel } from './batch-repository';
import { IUserModel, UserFormatter } from './user-repository';
import { BaseFormatter } from '../../util/base-formatter';
import { BaseRepository } from '../shared/base-repository';
import mongoose, { Schema } from 'mongoose';
import { MongoConnector } from '../../shared/mongo-connector';
import { IElectiveModel } from './elective-repository';
import { Inject, Singleton } from 'typescript-ioc';
import { cleanQuery } from '../../util/general-util';
import { IDownloadModel } from './download-repository';

export interface IClassModel {
    id?: string;
    batches: IBatchModel[];
    elective: IElectiveModel;
    students: IUserModel[];
    teacher: IUserModel;
    files: {
        file: IDownloadModel;
        createdAt: Date;
    }[];
}

export class ClassFormatter extends BaseFormatter implements IClassModel {
    batches: IBatchModel[];
    elective: IElectiveModel;
    students: IUserModel[];
    teacher: IUserModel;
    files: {
        file: IDownloadModel;
        createdAt: Date;
    }[];
    id: string;
    constructor(args: any) {
        super();
        this.format(args);
    }
}

@Singleton
export class ClassRepository extends BaseRepository<IClassModel> {
    protected modelName = 'classes';
    protected schema: Schema = new Schema(
        {
            elective: { type: mongoose.Schema.Types.ObjectId, ref: 'electives' },
            batches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'batches' }],
            students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }],
            teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
            files: [
                {
                    file: { type: mongoose.Schema.Types.ObjectId, ref: 'downloads' },
                    createdAt: { type: Date, required: true }
                }
            ]
        },
        { collection: this.modelName }
    );

    protected formatter = ClassFormatter;
    @Inject
    protected dbConnection: MongoConnector;
    constructor() {
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

    public async addClass(classObj: IClassModel): Promise<string> {
        let classId: IClassModel;
        const session = await this.documentModel.startSession();
        await session.withTransaction(async () => {
            classId = await this.create(classObj);
        });
        session.endSession();
        // @ts-ignore
        return classId.id;
    }

    public async removeClass(classId: string) {
        const session = await this.documentModel.startSession();
        await session.withTransaction(async () => {
            await this.delete(classId);
        });
        session.endSession();
    }

    public async findAndPopulate(skip = 0, limit = 250, sort: string, query: any): Promise<ClassFormatter[]> {
        const sortObject = cleanQuery(sort, this.sortQueryFormatter);
        return (
            await this.documentModel
                .find(this.cleanWhereQuery(query))
                .sort(Object.keys(sortObject).map((key) => [key, sortObject[key]]))
                .skip(skip)
                .limit(limit)
                .populate('elective')
                .populate('batch')
                .populate({
                    path: 'teacher',
                    select: 'name username _id rollNo role classes'
                })
                .populate({
                    path: 'files.file',
                    select: '_id fileId name shouldTrack trackAccess'
                })
        ).map((item) => new this.formatter(item));
    }

    public async getStudents(id: string) {
        return (
            await this.documentModel.find(this.cleanWhereQuery({ _id: id })).populate({
                path: 'students',
                select: 'name username _id rollNo role classes batch',
                populate: [
                    {
                        path: 'batch'
                    }
                ]
            })
        )
            .map((item) => new this.formatter(item))[0]
            .students.map((e) => new UserFormatter(e));
    }

    public async addResource(classId: string, resourceId: string) {
        await this.documentModel.findByIdAndUpdate(classId, {
            $push: {
                files: {
                    file: resourceId,
                    createdAt: new Date().toISOString()
                }
            }
        });
    }

    public async deleteResource(classId: string, resourceId: string) {
        await this.documentModel.findByIdAndUpdate(classId, {
            $pull: {
                // @ts-ignore
                files: {
                    // @ts-ignore
                    file: resourceId
                }
            }
        });
    }
}
