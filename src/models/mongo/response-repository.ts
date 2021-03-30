import {IUserModel, UserFormatter} from './user-repository';
import {ElectiveFormatter, IElectiveModel} from './elective-repository';
import {FormFormatter, IFormModel} from './form-repository';
import {BaseFormatter} from '../../util/base-formatter';
import {ProvideSingleton} from '../../shared/provide-singleton';
import {BaseRepository} from '../shared/base-repository';
import {Schema} from "mongoose";
import mongoose from 'mongoose';
import {inject} from 'inversify';
import {MongoConnector} from '../../shared/mongo-connector';
import {cleanQuery} from '../../util/general-util';

export interface IResponseModel {
    id ?: string;
    user: IUserModel;
    responses: IElectiveModel[];
    form: IFormModel;
    time: Date;
}

export class ResponseFormatter extends BaseFormatter implements IResponseModel {
    form: IFormModel;
    responses: IElectiveModel[];
    user: IUserModel;
    time: Date;
    id: string;
    constructor(args: any) {
        super();
        if (!(args instanceof mongoose.Types.ObjectId)) {
            this.format(args);
        }
        else {
            this.id = args.toString();
        }
        if (this.responses) {
            for (const [i, v] of args.responses.entries()) {
                if (v instanceof mongoose.Types.ObjectId) {
                    this.responses[i] = v.toString();
                }
                else if (typeof v === 'object') {
                    this.responses[i] = new ElectiveFormatter(v);
                }
            }
        }
        if (this.user) {
            if (args.user instanceof mongoose.Types.ObjectId) {
                this.user = args.user.toString();
            }
            else if (typeof args.user === 'object') {
                this.user = new UserFormatter(args.user);
            }
        }
        if (this.form) {
            if (args.form instanceof mongoose.Types.ObjectId) {
                this.form = args.form.toString();
            }
            else if (typeof args.form === 'object') {
                this.form = new FormFormatter(args.form);
            }
        }
    }
}

@ProvideSingleton(ResponseRepository)
export class ResponseRepository extends BaseRepository<IResponseModel> {
    protected modelName: string  = 'responses';
    protected schema: Schema = new Schema({
        form: { type: mongoose.Schema.Types.ObjectId, ref: 'forms' },
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
        time: { type: Date, required: true },
        responses: [{ type : mongoose.Schema.Types.ObjectId, ref: 'electives' }]
    }, { collection: this.modelName });

    protected formatter = ResponseFormatter;
    constructor(@inject(MongoConnector) protected dbConnection: MongoConnector) {
        super();
        super.init();
    }

    public async findAndPopulate(
        skip: number = 0,
        limit: number = 250,
        sort: string,
        query: any
    ): Promise<ResponseFormatter[]> {
        const sortObject = cleanQuery(sort, this.sortQueryFormatter);
        return (
            await this.documentModel
            .find(this.cleanWhereQuery(query))
            .sort(Object.keys(sortObject).map(key => [key, sortObject[key]]))
            .skip(skip)
            .limit(limit)
            .populate({
                path: 'user',
                populate: ['batch']
            })
            .populate('responses')
        )
        .map(item => new this.formatter(item));
    }

    public findToStream(
        sort: string,
        query: any,
        pipeCsv: any,
        pipeRes: any
    ): void {
        const sortObject = cleanQuery(sort, this.sortQueryFormatter);
        this.documentModel.find(this.cleanWhereQuery(query))
        .sort(Object.keys(sortObject).map(key => [key, sortObject[key]]))
        .populate('responses').populate({
            path: 'user',
            populate: ['batch']
        }).cursor().pipe(pipeCsv).pipe(pipeRes);
    }
}
