import * as mongoose from 'mongoose';

export const WechatySchema = new mongoose.Schema({
    _id: String,
    token: String,
    type: String,
    createdAt: Date,
    updatedAt: Date,
},
{
    collection: 'wechaty',
});