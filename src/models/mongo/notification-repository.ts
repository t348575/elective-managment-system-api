import { IUserModel } from './user-repository';
import { BaseFormatter } from '../../util/base-formatter';
import { ProvideSingleton } from '../../shared/provide-singleton';
import { BaseRepository } from '../shared/base-repository';
import mongoose, { Schema } from 'mongoose';
import { inject } from 'inversify';
import { MongoConnector } from '../../shared/mongo-connector';

export interface INotificationModel {
    id?: string;
    user: IUserModel;
    device: string;
    sub: {
        endpoint: string;
        expirationTime: null;
        keys: {
            p256dh: string;
            auth: string;
        };
    };
}

export class NotificationFormatter extends BaseFormatter implements INotificationModel {
    sub: { endpoint: string; expirationTime: null; keys: { p256dh: string; auth: string } };
    user: IUserModel;
    device: string;
    id: string;
    constructor(args: any) {
        super();
        this.format(args);
    }
}

@ProvideSingleton(NotificationRepository)
export class NotificationRepository extends BaseRepository<INotificationModel> {
    protected modelName = 'notifications';
    protected schema: Schema = new Schema(
        {
            sub: {
                endpoint: { type: String, required: true },
                expirationTime: { type: Number, required: false, nullable: true },
                keys: {
                    p256dh: { type: String, required: true },
                    auth: { type: String, required: true }
                }
            },
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'batches' },
            device: { type: String, required: true }
        },
        { collection: this.modelName, timestamps: true }
    );

    protected formatter = NotificationFormatter;
    constructor(@inject(MongoConnector) protected dbConnection: MongoConnector) {
        super();
        super.init();
    }

    public async findAndPopulate(id: string): Promise<NotificationFormatter[]> {
        return (
            await this.documentModel
                .aggregate([
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'user',
                            foreignField: '_id',
                            as: 'user'
                        }
                    },
                    {
                        $unwind: {
                            path: '$user'
                        }
                    },
                    {
                        $match: {
                            'user.batch': mongoose.Types.ObjectId(id)
                        }
                    }
                ])
                .exec()
        ).map((item: any) => new this.formatter(item));
    }
}
