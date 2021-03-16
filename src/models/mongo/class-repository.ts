import {IBatchModel} from './batch-repository';
import {IUserModel} from './user-repository';
import {BaseFormatter} from '../../util/base-formatter';
import {ProvideSingleton} from '../../shared/provide-singleton';
import {BaseRepository} from '../shared/base-repository';
import {Schema} from 'mongoose';
import mongoose from 'mongoose';
import {inject} from 'inversify';
import {MongoConnector} from '../../shared/mongo-connector';
import {IElectiveModel} from './elective-repository';

export interface IClassModel {
    id ?: string;
    batch: IBatchModel;
    elective: IElectiveModel,
    students: IUserModel[],
    teacher: IUserModel
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

@ProvideSingleton(ClassRepository)
export class ClassRepository extends BaseRepository<IClassModel> {
    protected modelName: string  = 'classes';
    protected schema: Schema = new Schema({
        elective: { type : mongoose.Schema.Types.ObjectId, ref: 'electives' },
        batch: { type : mongoose.Schema.Types.ObjectId, ref: 'batches' },
        students: [{ type : mongoose.Schema.Types.ObjectId, ref: 'users' }],
        teacher: { type : mongoose.Schema.Types.ObjectId, ref: 'users' }
    }, { collection: this.modelName });

    protected formatter = ClassFormatter;
    constructor(@inject(MongoConnector) protected dbConnection: MongoConnector) {
        super();
        super.init();
    }
}
