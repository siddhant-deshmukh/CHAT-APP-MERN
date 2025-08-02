import Chat from './Chat';

import logger from 'jet-logger';
import mongoose, { Document, Schema, Types } from 'mongoose';

export enum MessageType {
  Text = 'text',
  Image = 'img',
  Video = 'video',
  Document = 'doc',
}

export interface IMessageCreate {
  author_id: Types.ObjectId;
  chat_id: Types.ObjectId;
  type?: MessageType;
  text?: string;
}

export interface IMessage extends Document, IMessageCreate {
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema: Schema = new Schema({
  author_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author ID is required'],
  },
  chat_id: {
    type: Schema.Types.ObjectId,
    ref: 'Chat',
    required: [true, 'Chat ID is required'],
  },
  type: {
    type: String,
    enum: Object.values(MessageType),
    default: MessageType.Text,
  },
  text: {
    type: String,
    maxlength: [500, 'Message text cannot exceed 500 characters'],
  
  },
}, {
  timestamps: true,
});

MessageSchema.post<IMessage>('save', async function(doc) {
  try {  
    await Chat.findByIdAndUpdate(
      doc.chat_id,
      {
        $set: {
          last_msg: doc.text,
          last_msg_author: doc.author_id,
        },
      },
      {
        new: true,
      },
    );
  } catch (error) {
    if(error instanceof Error || (error?.stack)) error.stack = null;

    logger.err(error);
    logger.err(`Error updating chat after message save: ${error}`, true);
  }
});


const Message = mongoose.model<IMessage>('Message', MessageSchema);
export default Message;