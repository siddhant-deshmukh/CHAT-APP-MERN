import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  _id: string;
  name: string;
  user_name: string;
  avatarUrl: string;
  password: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    minlength: [5, 'Name must be at least 5 characters long'],
    maxlength: [30, 'Name cannot exceed 30 characters'],
    trim: true,
  },
  user_name: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [20, 'Username cannot exceed 20 characters'],
    trim: true,
    lowercase: true,
  },
  avatarUrl: {
    type: String,
    match: [/^https?:\/\/.+/, 'Please use a valid URL for the avatar'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
  },
  bio: {
    type: String,
    maxlength: [100, 'Bio cannot exceed 100 characters'],
  },
}, {
  timestamps: true,
});

const User = mongoose.model<IUser>('User', UserSchema);
export default User;