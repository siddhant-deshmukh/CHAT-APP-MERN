
import mongoose, { Document, Schema, Types } from 'mongoose';

export enum ChatMemberRole {
  Admin = 'admin',
  Member = 'member',
  Subscriber = 'subscriber'
  
}

export interface IChatMember extends Document {
  chat_id: Types.ObjectId;
  user_id: Types.ObjectId;
  role?: ChatMemberRole; 
  last_seen?: Date; 
  createdAt: Date;
  updatedAt: Date;
}

const ChatMemberSchema: Schema = new Schema({
  chat_id: {
    type: Schema.Types.ObjectId,
    ref: 'Chat', 
    required: [true, 'Chat ID is required'],
  },
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User', 
    required: [true, 'User ID is required'],
  },
  role: {
    type: String,
    enum: Object.values(ChatMemberRole), 
    
  },
  last_seen: {
    type: Date, 
    default: Date.now,
  },
}, {
  timestamps: true,
});

ChatMemberSchema.index({ chat_id: 1, user_id: 1 }, { unique: true });

const ChatMember = mongoose.model<IChatMember>('ChatMember', ChatMemberSchema);
export default ChatMember;