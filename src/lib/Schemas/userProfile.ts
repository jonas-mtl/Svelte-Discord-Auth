import mongoose, { Schema, model, modelNames, Document, models } from 'mongoose'

export enum Roles {
	ADMIN,
	USER,
}

export interface IUser extends Document {
	userID: string
	refreshToken: string
	accessToken: string
	dcData: Object
	role: Roles
}

export const UserSchema = new Schema({
	userID: String,
	refreshToken: String,
	accessToken: String,
	dcData: Object,
	role: String,
})

export default mongoose.models.User || model<IUser>('User', UserSchema)
