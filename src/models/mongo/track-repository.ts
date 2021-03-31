import {IUserModel, UserFormatter} from './user-repository';
import {BaseFormatter} from '../../util/base-formatter';
import mongoose, {Schema} from 'mongoose';
import {ProvideSingleton} from '../../shared/provide-singleton';
import {BaseRepository} from '../shared/base-repository';
import {inject} from 'inversify';
import {MongoConnector} from '../../shared/mongo-connector';

export interface ITrackModel {
    device: 'desktop' | 'mobile' | 'bot' | 'unknown';
    browser: string;
    platform: string;
    user: IUserModel;
    ip: string;
    id?: string;
}

export class TrackFormatter extends BaseFormatter implements ITrackModel {
    browser: string;
    device: "desktop" | "mobile" | "bot";
    ip: string;
    platform: string;
    user: IUserModel;
    id: string;
    constructor(args: any) {
        super();
        if (!(args instanceof mongoose.Types.ObjectId)) {
            this.format(args);
        }
        else {
            this.id = args.toString();
        }
        if (this.user) {
            if (args.user instanceof mongoose.Types.ObjectId) {
                this.user = args.user.toString();
            }
            else if (typeof args.user === 'object') {
                this.user = new UserFormatter(args.user);
            }
        }
    }
}

@ProvideSingleton(TrackRepository)
export class TrackRepository extends BaseRepository<ITrackModel> {
    protected modelName: string = 'track';
    protected schema: Schema = new Schema({
        browser: {type: String, required: true},
        device: {type: String, required: true, enum: ['desktop', 'mobile', 'bot', 'unknown']},
        platform: {type: String, required: true},
        ip: {type: String, required: true},
        user: {type: mongoose.Schema.Types.ObjectId, ref: 'users'}
    }, {collection: this.modelName, timestamps: true});

    protected formatter = TrackFormatter;

    constructor(@inject(MongoConnector) protected dbConnection: MongoConnector) {
        super();
        super.init();
    }
}
