import { ObjectId } from 'mongodb';
import mongoose, { Document, Schema, SchemaTypes } from 'mongoose';


export enum ChatType {
  Group = 'group_chat',
  User = 'user_chat',
}

export interface IChatCreate {
  chat_type: ChatType;
  bio?: string;
  avatarUrl?: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IChat extends Document, IChatCreate {
  members?: ObjectId[];
  last_msg?: string;
  last_msg_author?: Schema.Types.ObjectId;
}



const ChatSchema: Schema = new Schema({
  chat_type: {
    type: String,
    required: [true, 'Chat type is required'],
    enum: Object.values(ChatType),
  },
  bio: {
    type: String,
    maxlength: [100, 'Bio cannot exceed 100 characters'],
   
  },
  avatarUrl: {
    type: String,
   
    match: [/^https?:\/\/.+/, 'Please use a valid URL for the avatar'],
   
  },
  name: {
    type: String,
   
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  last_msg: {
    type: String,
  },
  last_msg_author: {
    type: SchemaTypes.ObjectId,
  },
}, {
  timestamps: true,
});


//* Before saving Chat check its type
ChatSchema.pre<IChat>('save', function(next) {
  if (this.chat_type === ChatType.Group) {
   
    if (!this.name || this.name.trim() === '') {
      const err = new mongoose.Error.ValidationError();
      err.addError('name', new mongoose.Error.ValidatorError({
        path: 'name',
        message: 'Name is required for group chats',
        value: this.name,
      }));
      return next(err);
    }
  } else if (this.chat_type === ChatType.User) {
    this.name = undefined;
    this.bio = undefined;
    this.avatarUrl = undefined;
  }

  next();
});



const Chat = mongoose.model<IChat>('Chat', ChatSchema);
export default Chat;