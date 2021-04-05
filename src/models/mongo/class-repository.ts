import { IBatchModel } from './batch-repository';
import { IUserModel } from './user-repository';
import { BaseFormatter } from '../../util/base-formatter';
import { BaseRepository } from '../shared/base-repository';
import mongoose, { Schema } from 'mongoose';
import { MongoConnector } from '../../shared/mongo-connector';
import { IElectiveModel } from './elective-repository';
import { Inject, Singleton } from 'typescript-ioc';

export interface IClassModel {
    id?: string;
    batch: IBatchModel;
    elective: IElectiveModel;
    students: IUserModel[];
    teacher: IUserModel;
}

export class ClassFormatter extends BaseFormatter implements IClassModel {
    batch: IBatchModel;
    elective: IElectiveModel;
    students: IUserModel[];
    teacher: IUserModel;
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
            batch: { type: mongoose.Schema.Types.ObjectId, ref: 'batches' },
            students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }],
            teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'users' }
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
}
